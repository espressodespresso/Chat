# Server
Server-side README
***
## Dependencies
Before running, ensure you have the following global NPM modules *or add them to the local project when pulled*
* [Typescript](https://github.com/Microsoft/TypeScript)
***
## Instructions
### Setup
* Install the relevant project dependencies using bun `bun install`
* Create an .env file in the server directory in the following format *with replaced parameters*
````dotenv
ORIGIN=youroriginaddress
PORT=4000(suggested)
MONGODB_URI=yourconnectionstring
ACCESS_TOKEN_SECRET=generatea256charstring
REFRESH_TOKEN_SECRET=generatea256charstring
````
* Create a folder called ssl in the main server dir
* Put a certificate.pem and private.pem files in the ssl folder
* Setup is now complete!
### Start-up (Development)
* `bun dev`
***
## API Endpoints
A comprehensive list of all API routes and relevant details
#### Quick Links
* [Auth Route](#auth_route)
* [Account Route](#account_route)
* [Chat Route](#chat_route)
* [Friend Route](#friend_route)
* [Socket Route](#socket_route)
***
## Generalised Bad Response
### Invalid Request Data
**400 Bad Request**
````json
{
  "status": false,
  "message": "Invalid request data",
  "code": 400
}
````
### Unauthorized Access (No Access Token) <a id="unauthorized_access"></a>
**401 Unauthorized**
````
Unauthorized
````
***
## Auth Route <a id="auth_route"></a>
### User Signup
**Method:** `POST`  
**EndPoint:** `/auth/signup`  
**Request Body (JSON):**
````json
{
  "username": "example_username",
  "password": "example_password",
  "email": "example@email.co.uk"
}
````
#### Response
**200 OK**
````json
{
  "status": true,
  "message": "User created successfully.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to create account.",
  "code": 400
}
````
### User Login
**Method:** `POST`  
**EndPoint:** `/auth/login`  
**Request Body (JSON):**
````json
{
  "username": "example_username",
  "password": "example_password"
}
````
**200 OK**
````json
{
"status": true,
"message": "User logged in successfully.",
"code": 200
}
````
**401 Unauthorized**
````json
{
  "status": false,
  "message": "Incorrect password.",
  "code": 401
}
````
### Renew Tokens
**Method:** `POST`  
**EndPoint:** `/auth/refresh`  
**Request Body (JSON):**
````json
{
  "refresh_token": "example_refresh_token"
}
````
**200 OK**
````json
{
  "access_token": "example_access_token",
  "refresh_token": "example_refresh_token",
  "response": {
    "status": true,
    "result": "Refresh token stored successfully."
  },
  "code": 200
}
````
**401 Unauthorized**
````json
{
  "response": {
    "status": false,
    "result": "Refresh token invalid."
  },
  "code": 401
}
````
### Logout User
**Method:** `POST`  
**EndPoint:** `/auth/logout`  
**Request Body (JSON):**
````json
{
  "refresh_token": "example_refresh_token"
}
````
**200 OK**
````json
{
  "status": true,
  "message": "User logged in successfully.",
  "code": 200
}
````
**401 Unauthorized**
````json
{
  "status": false,
  "message": "Unable to log out successfully.",
  "code": 401
}
````
***
## Account Route <a id="account_route"></a>
### Get Account Details
**Method:** `GET`  
**EndPoint:** `/account/accountDetails`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**200 OK**
````json
{
    "status": true,
    "result": {
        "_id": "example__id",
        "user_id": "example_user_id",
        "username": "example_username",
        "password": "example_password (HASHED)",
        "email": "example_email",
        "chat_list": [
            "example_chat_id"
        ],
        "friend_list": [
            {
                "user_id": "example_user_id"
            }
        ],
        "blocked_users": [
            {
                "user_id": "example_user_id"
            }
        ],
        "last_seen": "2025-03-25T12:03:37.677Z",
        "online": false,
        "options": {
            "theme": false,
            "display_name": "example_display_name"
        }
    },
    "code": 200
}
````
**401 Unauthorized**  
[Show Me](#unauthorized_access)
### Update Account Details
**Method:** `PUT`  
**EndPoint:** `/account/updateDetails`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "user_data": {
    "user_id": "example_user_id",
    "username": "example_username",
    "password": "example_password",
    "email": "example_email",
    "chat_list": ["chat_id"],
    "friend_list": [{
      "user_id": "example_chatuser_id"
    }],
    "blocked_users": [{
      "user_id": "example_chatuser_id"
    }],
    "last_seen": "2025-03-28T17:30:00Z",
    "online": false,
    "options": {
      "theme": false,
      "display_name": "example_display_name"
    }
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Account details updated successfully.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to update account details.",
  "code": 400
}
````
### Update Account Options
**Method:** `PATCH`  
**EndPoint:** `/account/updateDetails`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "options": {
    "theme": false,
    "display_name": "example_display_name"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Account options updated successfully.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to update account options.",
  "code": 400
}
````
***
## Chat Route <a id="chat_route"></a>
### Create Chat
**Method:** `POST`  
**EndPoint:** `/chat/create`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "chat_name": "example_chat_name",
  "users": [{
    "user_id": "example_chatuser_id"
  }]
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully created the chat.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to create the chat.",
  "code": 400
}
````
### Change Chat Name
**Method:** `PATCH`  
**EndPoint:** `/chat/changeName`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "chat_id": "example_chat_id",
  "new_name": "example_chat_name"
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully updated the chat name.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to update the chat name.",
  "code": 400
}
````
### Add Admin to Chat
**Method:** `PATCH`  
**EndPoint:** `/chat/addAdmin`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "chat_id": "example_chat_id",
  "recipient_user": {
    "user_id": "example_user_id"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully added admin to the chat.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to add user within that chat.",
  "code": 400
}
````
### Remove Admin from Chat
**Method:** `PATCH`  
**EndPoint:** `/chat/removeAdmin`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "chat_id": "example_chat_id",
  "recipient_user": {
    "user_id": "example_user_id"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully removed admin to the chat.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to remove user from the chat.",
  "code": 400
}
````
### Add User to Chat
**Method:** `PATCH`  
**EndPoint:** `/chat/addUser`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "chat_id": "example_chat_id",
  "recipient_user": {
    "user_id": "example_user_id"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully added user to the chat.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to add user to the chat.",
  "code": 400
}
````
### Remove User from Chat
**Method:** `PATCH`  
**EndPoint:** `/chat/removeUser`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "chat_id": "example_chat_id",
  "recipient_user": {
    "user_id": "example_user_id"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully removed user from the chat.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to remove user from the chat.",
  "code": 400
}
````
### Delete Chat
**Method:** `DELETE`  
**EndPoint:** `/chat/delete`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "chat_id": "example_chat_id"
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully deleted the chat.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "Unable to delete the chat.",
  "code": 400
}
````
## Friend Route <a id="friend_route"></a>
### Add Friend
**Method:** `PATCH`  
**EndPoint:** `/friend/addFriend`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "recipient_user": {
    "user_id": "example_user_id"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully added friend to friend list.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "You cannot add yourself as a friend.",
  "code": 400
}
````
### Remove Friend
**Method:** `PATCH`  
**EndPoint:** `/friend/removeFriend`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "recipient_user": {
    "user_id": "example_user_id"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully removed friend from friend list.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "You cannot remove yourself as a friend.",
  "code": 400
}
````
### Block User
**Method:** `PATCH`  
**EndPoint:** `/friend/block`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "recipient_user": {
    "user_id": "example_user_id"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully blocked user from account.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "You cannot block yourself.",
  "code": 400
}
````
### Block User
**Method:** `PATCH`  
**EndPoint:** `/friend/unblock`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**Request Body (JSON):**
````json
{
  "recipient_user": {
    "user_id": "example_user_id"
  }
}
````
**200 OK**
````json
{
  "status": true,
  "message": "Successfully unblocked user from account.",
  "code": 200
}
````
**400 Bad Request**
````json
{
  "status": false,
  "message": "You cannot unblock yourself.",
  "code": 400
}
````
## Socket Route <a id="socket_route"></a>
### WebSocket
**Method:** `GET`  
**EndPoint:** `/socket/`  
**Authentication:** `Requires Bearer Access Token`
````http
Authorization: Bearer example_access_token
Content-Type: application/json
````
**1011 Server Error**
````
Token not provided as a query.
````
**Example Message**
````json
{
  "recipient_id": "string",
  "sender_id": "string",
  "message": "ISOCKETDATA",
  "timestamp": {
    "event": "ESOCKETEVENT",
    "data": "ISOCKETMESSAGEDATA | ISOCKETDATAUPDATE"
  }
}
````