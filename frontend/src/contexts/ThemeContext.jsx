import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import PropTypes from 'prop-types';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("rh_theme") || "system";
    } catch {
      return "system";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");

    if (theme === "dark") root.classList.add("theme-dark");
    if (theme === "light") root.classList.add("theme-light");

    try {
      localStorage.setItem("rh_theme", theme);
    } catch (e) {
      console.log(e);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// ✅ Only export useTheme once
export const useTheme = () => useContext(ThemeContext);
