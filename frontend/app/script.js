let listMessage = document.querySelector(".list-message");
let sendBtn = document.querySelector(".send-message");
let text = document.querySelector(".input-text");
let chatDiv = document.querySelector(".chat");
let users = document.querySelector(".users");
let dropMenu = document.querySelector(".drop-menu");
let profileName = document.querySelector(".profile-name");
let stateOnline = document.querySelector(".state-online");
let groupChats = document.querySelector(".group-chats");

// достаю токен из url
const paramsString = window.location.search;
const searchParams = new URLSearchParams(paramsString);
const token = searchParams.get("token");

let socket = io("http://localhost:5000", {
  auth: {
    token: token,
  },
});

let toggle = false; // состояние меню
let toggleChoiceUser = false; // состояние выбора человека
let toggleFriend = ""; // token другана
let myName = "";
let checkRoom = ""; // проверка комнаты при переключении диалогов

initLoad();
emptyChat();

socket.on("join_room", joinRoom); // получение токена и имени друга для комнаты
socket.on("get_room", getRoom); // получение комнаты
socket.on("message", getMessage);
socket.on("connect", async () => {
  await addUserInMenu();
}); // вызов выпадающего меню
socket.on("get_name", (data) => {
  myName = data;
});
// очищаю и добавляю прошлые сообщения при переходе между чатами
socket.on("get_chat_messages", (data) => {
  if (checkRoom === data["room"]) {
    listMessage.innerHTML = "";
    // добавляю в чат сообщения в зависимости от отправителя
    data["message"].map((el) => {
      let elToken = el["token"];
      let mes = el["message"];

      if (elToken === token) {
        addClassToSendMessage(mes);
      } else {
        getMessage({ room: data["room"], message: mes });
      }
    });
  }
});

text.addEventListener("change", sendMessage);
users.addEventListener("click", funcToggle);
dropMenu.addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    const tokenFriend = event.target.dataset.token;
    const nameElement = event.target.textContent;

    let checkChat = funcCheckChat(nameElement);
    // проверка имени чтобы чаты не повторялись
    if (!checkChat) {
      socket.emit("join_room", { token, tokenFriend });
      toggleFriend = tokenFriend; // токен другана
      profileName.textContent = event.target.textContent; //имя другана
      dropMenu.style.opacity = "0"; // скрываю выпадающую меню с именами
      toggleChoiceUser = true; // состояние скрывающейся менюшки
      initLoad(); // начальный экран
      addGroupChat(event.target.textContent, tokenFriend); // добавление чатов
    }
  }
});

groupChats.addEventListener("click", (event) => {
  const room = event.target.dataset.tokenRoom;
  checkRoom = room;
  console.log(room, "room from chat");
  socket.emit("have_room", room);
  profileName.textContent = event.target.textContent;
  let findTagP = event.target.querySelector(".list-chat_name");
  toggleFriend = findTagP.dataset.tokenFriend;
});

// получение людей и добавление в выпадающее меню
const getUsers = async () => {
  try {
    let response = await fetch("http://localhost:5000/get-all-users");
    let data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

// проверка имени чтобы чаты не повторялись
function funcCheckChat(name) {
  let allChatsName = document.querySelectorAll(".list-chat_name");
  return Array.from(allChatsName).some(
    (el) => el.textContent.toLowerCase() === name.toLowerCase()
  );
}

// создание чата в панели
function addGroupChat(friendName, tokenFriend, room) {
  let li = document.createElement("li");
  li.classList.add("list-chats_item");
  li.dataset.tokenRoom = room;

  let img = document.createElement("div");
  img.classList.add("list-chat_img");

  let block = document.createElement("div");
  img.classList.add("list-chat_block");

  let p = document.createElement("p");
  p.classList.add("list-chat_name");
  p.textContent = friendName;
  p.dataset.tokenFriend = tokenFriend;

  block.append(p);
  li.append(img);
  li.append(block);

  groupChats.append(li);
}

function getRoom(data) {
  checkRoom = data;
}

// присоединение к комнате
function joinRoom(data) {
  listMessage.innerHTML = ""; // при клике на новый чат убираю лишние сообщения
  console.log(data, "DATA JOIN ROOM");
  console.log(data["room"], "room add chat");
  profileName.textContent = data["name"];
  toggleFriend = data["token"];
  checkRoom = data["room"];

  addGroupChat(data["name"], toggleFriend, data["room"]);

  toggleChoiceUser = true;
  initLoad();
}

// начальная закгрузка экрана
function initLoad() {
  if (!toggleChoiceUser) {
    chatDiv.style.backgroundColor = "#1e1e1e";
    chatDiv.style.display = "none";
  } else {
    chatDiv.style.display = "flex";
  }
}

// добавление людей в меню
async function addUserInMenu() {
  let userDict = await getUsers();
  Object.entries(userDict).map((el) => {
    let li = document.createElement("li");
    li.textContent = el[1];
    li.classList.add("menu-item");
    li.dataset.token = el[0];
    dropMenu.appendChild(li);
  });
}

// состояние меню
function funcToggle() {
  toggle = !toggle;
  if (toggle) {
    dropMenu.style.opacity = "1";
    dropMenu.style.visibility = "visible";
    dropMenu.style.pointerEvents = "auto";
    dropMenu.style.zIndex = "100";
  } else {
    dropMenu.style.opacity = "0";
    dropMenu.style.visibility = "hidden";
    dropMenu.style.pointerEvents = "none";
    dropMenu.style.zIndex = "-1";
  }
}

// проверка пустого чата
function emptyChat() {
  let mes = chatDiv.querySelector(".block-empty-chat");
  if (listMessage.children.length !== 0 && mes) {
    chatDiv.removeChild(mes);
  }
}

function getMessage(data) {
  console.log(data);

  console.log(checkRoom, "checkRoom");

  if (data["room"] === checkRoom) {
    let item = document.createElement("li");
    item.classList.add("message-item-get");
    item.classList.add("message-item");
    item.textContent = data["message"];
    listMessage.appendChild(item);
    emptyChat();
  }
}

function sendMessage(event) {
  const message = event.target.value;
  socket.emit("message", { message, toggleFriend, token });
  addClassToSendMessage(message);

  text.value = "";
  emptyChat();
}

function addClassToSendMessage(message) {
  let item = document.createElement("li");
  item.classList.add("message-item-send");
  item.classList.add("message-item");
  item.textContent = message;
  listMessage.appendChild(item);
}
