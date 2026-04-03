import { rooms, filteredRooms, renderRooms } from "./presence-management-1.js";
import { setPage, getPaginationInfo } from "./presence-management-1.js";

const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");

const searchBtn = document.getElementById("searchBtn");
const searchContainer = document.getElementById("searchContainer");
const searchInput = document.getElementById("searchInput");

const sortBtn = document.getElementById("sortBtn");
const filterBtn = document.getElementById("filterBtn");

let asc = false;
let currentFilter = "all";


// ===============================
// TOGGLE SEARCH
// ===============================
searchBtn.addEventListener("click", () => {
  searchContainer.classList.toggle("hidden");
  searchInput.focus();
});


// ===============================
// SEARCH
// ===============================
searchInput.addEventListener("input", () => {

  const value = searchInput.value.toLowerCase();

  const result = rooms.filter(r => {

    return (
      r.chorale?.toLowerCase().includes(value) ||
      r.type?.toLowerCase().includes(value) ||
      r.createdByName?.toLowerCase().includes(value) ||
      r.description?.toLowerCase().includes(value)
    );

  });

  applyFilter(result);

});


// ===============================
// FILTER (actif / fermé)
// ===============================
filterBtn.addEventListener("click", () => {

  if (currentFilter === "all") currentFilter = "active";
  else if (currentFilter === "active") currentFilter = "closed";
  else currentFilter = "all";

  applyFilter(rooms);

});


// ===============================
// SORT
// ===============================
sortBtn.addEventListener("click", () => {

  asc = !asc;

  filteredRooms.sort((a, b) => {
    return asc
      ? new Date(a.date) - new Date(b.date)
      : new Date(b.date) - new Date(a.date);
  });

  renderRooms();

});


// ===============================
// APPLY FILTER
// ===============================
function applyFilter(base) {

  let result = [...base];

  if (currentFilter === "active") {
    result = result.filter(r => r.status === "active");
  }

  if (currentFilter === "closed") {
    result = result.filter(r => r.status === "closed");
  }

  filteredRooms.length = 0;
  filteredRooms.push(...result);

  renderRooms();

}
// ===============================
// PAGINATION
// ===============================
prevPage.addEventListener("click", () => {

  const { current } = getPaginationInfo();

  if (current > 0) {
    setPage(current - 1);
  }

});

nextPage.addEventListener("click", () => {

  const { current, total } = getPaginationInfo();

  if (current < total - 1) {
    setPage(current + 1);
  }

});
