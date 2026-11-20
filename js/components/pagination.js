(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.pagination = {
    render(containerId, currentPage, totalItems, pageSize, onPageChange) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
      if (pageCount <= 1) {
        container.innerHTML = "";
        return;
      }
      let pages = "";
      for (let page = 1; page <= pageCount; page += 1) {
        pages += `<li class="page-item ${page === currentPage ? "active" : ""}"><button class="page-link" data-page="${page}">${page}</button></li>`;
      }
      container.innerHTML = `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}"><button class="page-link" data-page="${currentPage - 1}" aria-label="Previous">Previous</button></li>
        ${pages}
        <li class="page-item ${currentPage === pageCount ? "disabled" : ""}"><button class="page-link" data-page="${currentPage + 1}" aria-label="Next">Next</button></li>`;
      container.querySelectorAll("[data-page]").forEach((button) => {
        button.addEventListener("click", () => {
          const page = Number(button.dataset.page);
          if (page >= 1 && page <= pageCount) onPageChange(page);
        });
      });
    }
  };
})();
