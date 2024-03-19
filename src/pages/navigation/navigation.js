import React from "react";
import { Menu } from "antd";
import { Link } from "react-router-dom";
import {
  AppstoreOutlined,
  MailOutlined,
  SettingOutlined,
  HomeOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import "./navigation.css";
const { SubMenu } = Menu;

const items = [
  {
    label: "Live",
    key: "live",
    icon: <VideoCameraOutlined />,
    path: "/live",
  },
  {
    label: "Search",
    key: "search",
    icon: <AppstoreOutlined />,
    path: "/search",
  },
  // Ajoutez d'autres éléments de menu avec leurs chemins
];

const Navigation = () => {
  return (
    <Menu mode="horizontal" className="menu-horizontal">
      <Menu.Item key="logo" className="logo-container">
        <Link to="/" className="logo-container">
          <img
            src="https://data-doit.com/wp-content/uploads/2022/11/datadoit1-150x150.png"
            alt="Logo de la plateforme"
            className="logo-img"
          />
          <div className="logo-text">DATADOIT</div>
        </Link>
      </Menu.Item>
      {items.map((item) => (
        <Menu.Item key={item.key} icon={item.icon}>
          <Link to={item.path}>{item.label}</Link>
        </Menu.Item>
      ))}
    </Menu>
  );
};

export default Navigation;
