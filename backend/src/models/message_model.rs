use uuid::Uuid;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct MessagePosting {
    pub content : String, 
    pub name : String, 
    pub user_id : Uuid
}

#[derive(Deserialize, Serialize, Clone)]
pub struct MessageRecieving {
    pub content : String, 
    pub name : String,
}

#[derive(Deserialize, Serialize, Default)]
pub struct AllMessagesRecieving {
    pub messages : Vec<MessageRecieving>
}
