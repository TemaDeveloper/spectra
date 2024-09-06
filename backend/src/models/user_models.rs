
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct CreateUser{
    pub username : String, 
    pub password : String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username : String, 
    pub password : String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token : String, 
}
