import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './styles.css';
import { ASSET_PATHS } from '../../utils/assetPaths';

const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav>
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">
            <img src={ASSET_PATHS.COMPANY_LOGO} alt="Company Logo" className="nav-logo" />
          </Link>
          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
          >
            <span className="menu-icon"></span>
          </button>
        </div>
        <ul
          ref={menuRef}
          className={`nav-links ${isMenuOpen ? 'active' : ''}`}
        >
          <li className={isActive('/') ? 'active' : ''}>
            <Link to="/">Dashboard</Link>
          </li>
          <li className={isActive('/audits') ? 'active' : ''}>
            <Link to="/audits">Audit List</Link>
          </li>
          <li className={isActive('/form') ? 'active' : ''}>
            <Link to="/form">Rack Audit</Link>
          </li>
          <li className={isActive('/customers') ? 'active' : ''}>
            <Link to="/customers">Customers</Link>
          </li>
          <li className={isActive('/scheduled-audits') ? 'active' : ''}>
            <Link to="/scheduled-audits">Scheduled Audits</Link>
          </li>
          <li className={isActive('/settings') ? 'active' : ''}>
            <Link to="/settings">Settings</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Nav;
