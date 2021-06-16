import React from 'react';
import Sidebar from './sidebar';
import Header from './header';
import Fetch from 'fetch';
import UserSettings from './usersettings';
import UserPins from './userpins';
import GuildSettings from './guildsettings';
import LoadingPane from './loadingpane';

class Configurator extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            mainPage: "loader",
            panePage: "userSettings"
        };
    }
    
    componentDidMount() {
        Fetch.get("/auth/me").then(results => {
            let guilds = results.guilds;
            guilds.sort((firstEl, secondEl) => {
                let first = firstEl.name.toLowerCase();
                let second = secondEl.name.toLowerCase();
                if (first < second) {
                    return -1;
                } else if (first > second) {
                    return 1;
                } else {
                    return 0;
                }
            });
            this.setState({
                user: results.user,
                guilds: guilds,
                mainPage: "configurator"
            });
        }).catch(err => {
            if (err.status === 401) {
                //Log out and try again
                localStorage.removeItem("token");
                this.props.tokenChanged();
            } else {
                this.setState({
                    mainPage: "error"
                });
            }
        });
    }
    
    currentPane() {
        if (this.state.panePage === "userSettings") {
            return <UserSettings />
        } else if (this.state.panePage === "userPins") {
			return <UserPins />
		} else {
            return <GuildSettings key={this.state.panePage} guildId={this.state.panePage} />
        }
    }
    
    changePane(key) {
        this.setState({
            panePage: key
        });
    }
    
    betaBar() {
        if (CONFIG.unstable) {
            return <div className="containerVertical containerPadded" style={{borderBottom: "1px solid white"}}>
                <b>PREVIEW</b>
                <span>Thanks for giving {CONFIG.bot.name} a go. Keep in mind you're running a preview, so not everything will work correctly.</span>
            </div>
        }
        return null;
    }
    
    render() {
        if (this.state.mainPage === "loader") {
            return <div className="mainContainer containerVertical containerCenter">
                <LoadingPane />
            </div>
        } else if (this.state.mainPage === "error") {
            return <div className="mainContainer containerVertical containerCenter">
                <h1>Hmm...</h1>
                <p>Looks like the server isn't working correctly. Give it a bit and reload the page to try again.</p>
                <a className="button" onClick={() => {
                    window.location.reload();
                }}>Reload</a>
            </div>
        } else {
            return <div className="mainContainer containerVertical">
                <Header user={this.state.user} tokenChanged={this.props.tokenChanged}/>
                {this.betaBar()}
                <div className="containerHorizontal grow">
                    <Sidebar guilds={this.state.guilds} current={this.state.panePage} changePane={this.changePane.bind(this)} />
                    {this.currentPane()}
                </div>
            </div>
        }
    }
}

export default Configurator;
