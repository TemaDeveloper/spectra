
use serde::{Deserialize, Serialize};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::str;

#[derive(Deserialize)]
pub struct LoginPayload {
    pub credentials: String, 
}

// Decode credentials from base64 and return username and password
pub fn decode_credentials(encoded: &str) -> Result<(String, String), Box<dyn std::error::Error>> {
    // Use the standard base64 engine to decode the credentials
    let decoded_bytes = STANDARD.decode(encoded)?;
    
    // Convert bytes to string
    let decoded_str = str::from_utf8(&decoded_bytes)?;

    // Split the decoded string by ':' to get username and password
    let parts: Vec<&str> = decoded_str.split(':').collect();
    
    if parts.len() != 2 {
        return Err("Invalid encoded credentials".into());
    }

    let username = parts[0].to_string();
    let password = parts[1].to_string();

    Ok((username, password))
}

#[derive(Deserialize, Serialize)]
pub struct CreateUser{
    pub username : String, 
    pub password : String,
}


