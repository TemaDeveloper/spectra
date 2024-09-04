use axum::response::IntoResponse;
use jsonwebtoken::{encode, EncodingKey, Header};
use sea_orm::sqlx::types::chrono::Utc;
use lazy_static::lazy_static;
use rand::{distributions::Alphanumeric, Rng};
use crate::models::jwt_claims::{Claims, VALID_FOR};

lazy_static! {
    /// NOTE: regenerated after each server restart
    pub static ref SECRET_KEY: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
}

pub fn issue_jwt(uid : String, role : String) -> Result<String, jsonwebtoken::errors::Error>{
    encode(&Header::default(), 
        &Claims { exp : (Utc::now() + VALID_FOR).timestamp() as usize, uid: uid, role: role },
        &EncodingKey::from_secret(SECRET_KEY.as_bytes())
    )
}

