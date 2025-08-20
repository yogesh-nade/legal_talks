import React from 'react';

const MobileUserMenu = ({ user, handleLogout }) => {
  return (
    <div>
      {/* Placeholder for MobileUserMenu component */}
      {user ? (
        <div>
          <span>{user.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <button>Login</button>
        </div>
      )}
    </div>
  );
};

export default MobileUserMenu;
