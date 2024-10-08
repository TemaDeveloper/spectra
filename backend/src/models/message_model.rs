use uuid::Uuid;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct MessagePosting {
    pub content : String, 
    pub sender_id : Uuid, 
    pub room: String,
    pub sending_time: String,
}

#[derive(Deserialize, Debug)]
pub struct MessageIn{
    pub room: String, 
    pub content: String,
    pub sender_id: Uuid
}

#[derive(Serialize, Clone)]
pub struct MessageOut{
    pub content: String, 
    pub sender_id: Uuid, 
    pub date: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct MessageRecieving {
    pub content : String, 
    pub sender_id : String,
    pub sending_time: String, 
    pub room : String,
}

#[derive(Deserialize, Serialize, Default)]
pub struct AllMessagesRecieving {
    pub messages : Vec<MessageRecieving>
}
