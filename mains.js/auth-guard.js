// mains.js/auth-guard.js

export function checkAuth() {

const storedUser =
localStorage.getItem("myum_user") ||
sessionStorage.getItem("myum_user");

if(!storedUser){

window.location.href="/myUm/users/login.html";
return null;

}

let user;

try{

user = JSON.parse(storedUser);

}catch(error){

console.error("Session utilisateur corrompue :",error);

localStorage.removeItem("myum_user");
sessionStorage.removeItem("myum_user");

window.location.href="/myUm/users/login.html";
return null;

}


// vérification structure session

if(
!user ||
!user.id ||
!user.username ||
!user.role
){

localStorage.removeItem("myum_user");
sessionStorage.removeItem("myum_user");

window.location.href="/myUm/users/login.html";
return null;

}

return user;

}
