import React from "react";
import Heading from "./heading";

class SidebarItem extends React.Component {
    classes() {
        let classes = ["listItem"];
        if (this.props.current === this.props.pane) {
            classes.push("selected");
        }
        return classes.join(" ");
    }
    
    click() {
        this.props.changePane(this.props.pane);
    }
    
    render() {
        return <div className={this.classes()} onClick={this.click.bind(this)}>{this.props.text}</div>
    }
}

class Sidebar extends React.Component {
    guilds() {
        let els = [];
        for (let guild of this.props.guilds) {
            if (guild.permissions & 0x00000020 || guild.permissions & 0x00000008 || guild.owner) {
                els.push(<SidebarItem text={guild.name} key={guild.id} pane={guild.id} current={this.props.current} changePane={this.props.changePane} />);
            }
        }
        return els;
    }
    
    render() {
        return <div className="sidebar">
            <div className="sidebarWrapper">
                <Heading title="Settings" />
                <div className="containerScrollable">
                    <SidebarItem text="User Settings" key="userSettings" pane={"userSettings"} current={this.props.current} changePane={this.props.changePane} />
                    <SidebarItem text="Portable Pins" key="userPins" pane={"userPins"} current={this.props.current} changePane={this.props.changePane} />
                    <div className="horizontalLine" />
                    {this.guilds()}
                </div>
            </div>
        </div>
    }
}

export default Sidebar;
