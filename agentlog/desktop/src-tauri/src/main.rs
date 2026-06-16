// Prevents an additional console window on Windows in release builds — required
// for a clean GUI wrapper. (Verbatim house pattern: helm/mortar src/main.rs.)
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    histograph_lib::run()
}
