export default class Post {
  constructor() {
    this.deleteForm = document.querySelector(".delete-post-form");
    this.events();
  }

  events() {
    this.deleteForm.addEventListener("submit", (e) => this.deletePost(e));
  }

  deletePost(e) {
    e.preventDefault();
    confirm("Do you really want to delete this post permanently?") &&
      this.deleteForm.submit();
  }
}
