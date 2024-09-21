use uuid::Uuid;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct MessagePosting {
    pub content : String, 
    pub name : String, 
    pub user_id : Uuid
}

// #[derive(Deserialize, Serialize, Clone)]
// pub struct Message{
//     id: u64,
//     content: String, 
//     time: String,
// }

// #[derive(Serialize)]
// pub struct Room{
//     sender_id : Vec<Uuid>, 
//     recipient_id : Vec<Uuid>, 
//     room_id : Uuid, 
//     messages : Vec<Message>
// }

#[derive(Deserialize, Debug)]
pub struct MessageIn{
    pub room: String, 
    pub content: String,
}

#[derive(Serialize)]
pub struct MessageOut{
    pub content: String, 
    pub user_id: String, 
    pub date: chrono::DateTime<chrono::Utc>,
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
