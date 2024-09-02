use core::fmt;

use chrono::TimeDelta;
use serde::{Deserialize, Serialize};

pub const VALID_FOR: TimeDelta = chrono::TimeDelta::seconds(60*60*24); //1 day

#[derive(Serialize, Deserialize, Debug)]
pub struct Claims {
    pub uid : String, 
    pub role : String, 
    pub exp : usize, 
}

impl fmt::Display for Role {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Role::User => write!(f, "User"),
            Role::Admin => write!(f, "Admin")
        }
    }
}

#[derive(Clone, PartialEq)]
pub enum Role{
    User, 
    Admin
} 

impl Role {
    pub fn from_str(role : &str) -> Role {
        match role {
            "Admin" => Role::Admin, 
            _ => Role::User,
        } 
    } 
}

