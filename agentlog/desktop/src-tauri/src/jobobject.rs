//! Windows Job Object that makes the sidecar die with the parent even on a HARD
//! exit — force-kill (taskkill /F), a crash, or any path that skips the graceful
//! RunEvent::Exit / kill_on_drop teardown. The job is configured
//! KILL_ON_JOB_CLOSE and the child is assigned to it; the returned handle is held
//! for the app's lifetime (in SidecarState). When the Histograph process dies for
//! ANY reason the OS closes that handle, the job closes, and the assigned `python`
//! serve is terminated. This is the canonical guarantee behind sidecar.rs's
//! "never orphaned" promise (kill_on_drop + RunEvent::Exit only cover graceful
//! teardown). No-op on non-Windows.

#[cfg(windows)]
mod imp {
    use std::ffi::c_void;
    use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, SetInformationJobObject,
        JobObjectExtendedLimitInformation, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_SET_QUOTA, PROCESS_TERMINATE,
    };

    /// Owns a Job Object handle. Holding it alive keeps the kill-on-close guarantee
    /// in force; dropping it (or the owning process exiting) closes the job and
    /// terminates every assigned process.
    pub struct KillOnCloseJob(HANDLE);

    // A job handle is an OS kernel handle — safe to move/share for our single
    // owner-held-in-managed-State usage.
    unsafe impl Send for KillOnCloseJob {}
    unsafe impl Sync for KillOnCloseJob {}

    impl Drop for KillOnCloseJob {
        fn drop(&mut self) {
            if !self.0.is_null() {
                unsafe { CloseHandle(self.0) };
            }
        }
    }

    /// Create a KILL_ON_JOB_CLOSE job, assign the process `pid` to it, and return
    /// the owned handle to hold for the app's lifetime. Best-effort: returns None
    /// on any failure (the graceful kill_on_drop / RunEvent::Exit paths still apply).
    pub fn assign(pid: u32) -> Option<KillOnCloseJob> {
        unsafe {
            let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
            if job.is_null() {
                return None;
            }
            let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
            info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            let ok = SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                &info as *const _ as *const c_void,
                std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            );
            if ok == 0 {
                CloseHandle(job);
                return None;
            }
            let proc = OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, 0, pid);
            if proc.is_null() {
                CloseHandle(job);
                return None;
            }
            let assigned = AssignProcessToJobObject(job, proc);
            CloseHandle(proc);
            if assigned == 0 {
                CloseHandle(job);
                return None;
            }
            Some(KillOnCloseJob(job))
        }
    }
}

#[cfg(windows)]
pub use imp::{assign, KillOnCloseJob};

#[cfg(not(windows))]
pub struct KillOnCloseJob;

#[cfg(not(windows))]
pub fn assign(_pid: u32) -> Option<KillOnCloseJob> {
    None
}
