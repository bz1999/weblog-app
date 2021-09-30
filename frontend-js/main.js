import Search from "./modules/search";
import Post from "./modules/post";
import Chat from "./modules/chat";
import RegistrationForm from "./modules/registrationForm";

if (document.querySelector(".header-search-icon")) {
  new Search();
}

if (document.querySelector(".delete-post-form")) {
  new Post();
}

if (document.querySelector("#chat-wrapper")) {
  new Chat();
}

if (document.querySelector("#registration-form")) {
  new RegistrationForm();
}
