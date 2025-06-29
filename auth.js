// auth.js - User authentication state management

document.addEventListener('DOMContentLoaded', function() {
  updateNavigation();
  setupNavLogoutButton();
});

// Function to update navigation based on login status
function updateNavigation() {
  const user = getCurrentUser();
  const isAdminLoggedIn = checkAdminLogin();
  const navContainer = document.querySelector('.main-nav');
  
  if (!navContainer) return;
  
  // Get the login link
  const loginLink = navContainer.querySelector('.nav-login');
  
  // If user is logged in
  if (user) {
    // Update the login link to show the user's name
    if (loginLink) {
      loginLink.textContent = user.name;
      loginLink.href = '#'; // Could point to a profile page in the future
      loginLink.classList.add('nav-user');
    }
    
    // Add logout button if it doesn't exist
    if (!navContainer.querySelector('.nav-logout')) {
      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.className = 'nav-link nav-logout';
      logoutLink.textContent = 'Logout';
      logoutLink.addEventListener('click', handleUserLogout);
      navContainer.appendChild(logoutLink);
    }
  } 
  // If admin is logged in but not regular user
  else if (isAdminLoggedIn) {
    // Update the login link to show "Admin"
    if (loginLink) {
      loginLink.textContent = 'Admin';
      loginLink.href = 'admin-dashboard.html';
      loginLink.classList.add('nav-user');
    }
    
    // Add logout button if it doesn't exist
    if (!navContainer.querySelector('.nav-logout')) {
      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.className = 'nav-link nav-logout';
      logoutLink.textContent = 'Logout';
      logoutLink.addEventListener('click', handleAdminLogout);
      navContainer.appendChild(logoutLink);
    }
  }
  // If neither user nor admin is logged in
  else {
    // If user is not logged in, ensure login link is correct
    if (loginLink) {
      loginLink.textContent = 'Login';
      loginLink.href = 'login.html';
      loginLink.classList.remove('nav-user');
    }
    
    // Remove logout button if it exists
    const logoutButton = navContainer.querySelector('.nav-logout');
    if (logoutButton) {
      navContainer.removeChild(logoutButton);
    }
  }
}

// Function to check if admin is logged in
function checkAdminLogin() {
  return localStorage.getItem('admin') === 'true';
}

// Function to handle user logout
function handleUserLogout(e) {
  e.preventDefault();
  // Clear user data from localStorage
  localStorage.removeItem('user');
  // Update navigation
  updateNavigation();
  // Redirect to home page if we're on a restricted page
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage === 'adoption.html') {
    window.location.href = 'index.html';
  } else {
    // Just refresh the current page to update UI
    location.reload();
  }
}

// Function to handle admin logout
function handleAdminLogout(e) {
  e.preventDefault();
  // Clear admin status from localStorage
  localStorage.removeItem('admin');
  // Update navigation
  updateNavigation();
  // Redirect to home page
  window.location.href = 'index.html';
}

// Function to set up the logout button in navigation
function setupNavLogoutButton() {
  const logoutButton = document.querySelector('.nav-logout');
  if (logoutButton) {
    if (checkAdminLogin()) {
      logoutButton.addEventListener('click', handleAdminLogout);
    } else {
      logoutButton.addEventListener('click', handleUserLogout);
    }
  }
}

// Function to get the current user from localStorage
function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

// Function to check if user is logged in
function isLoggedIn() {
  return !!getCurrentUser();
}

// Function to check if any type of user (admin or regular) is logged in
function isAnyUserLoggedIn() {
  return isLoggedIn() || checkAdminLogin();
}

// Expose some functions for use in other scripts
window.Auth = {
  getCurrentUser,
  isLoggedIn,
  isAnyUserLoggedIn,
  checkAdminLogin,
  handleUserLogout,
  handleAdminLogout,
  updateNavigation
};