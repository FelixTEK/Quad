import React from 'react';
import Heading from './heading';
import PaneGroup from './panegroup';
import LoadingPane from './loadingpane';
import Fetch from 'fetch';
import Modal from 'modal';
import Cmdlink from './cmdlink';

class GuildSettings extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            currentPage: "loader"
        };
    }
    
    componentDidMount() {
        this.retrieveServerInformation();
    }
    
    retrieveServerInformation() {
        this.setState({
            currentPage: "loader"
        });
        
        Fetch.get(`/guilds/${this.props.guildId}`).then(response => {
            this.setState({
                settings: response.settings,
                guild: response.guild,
                channels: response.channels,
                currentPage: "configure"
            });
        }).catch(err => {
            this.setState({
                currentPage: "error"
            });
        });
    }
    
    addQuad() {
        window.open(`https://discordapp.com/api/oauth2/authorize?client_id=${CONFIG.discord.client_id}&redirect_uri=${encodeURIComponent(`${CONFIG.server.rootAddress}/popupCallback.html`)}&scope=bot&permissions=8&guild_id=${this.props.guildId}`, "_blank", "dependent,height=700,width=400");
    }
    
    onPrefixChange(event) {
        let newPrefix = event.target.value;
        this.setState(state => {
            let settings = state.settings;
            settings.prefix = newPrefix;
            return {
                settings: settings
            };
        });
    }

    onAutobansChange(event) {
        let newAutobans = event.target.value;
        this.setState(state => {
            let settings = state.settings;
            settings.autobans = newAutobans;
            return {
                settings: settings
            };
        });
    }
    
    setGuildSetting(event) {
        let key = event.target.name;
        let value = event.target.value;
        Fetch.post(`/guilds/${this.props.guildId}/set`, {
            [key]: value
        });
        this.setState(state => {
            let oldSettings = state.settings;
            oldSettings[key] = value;
            return {
                settings: oldSettings
            };
        });
    }
    
    resetServer() {
        let performReset = () => {
            Fetch.delete(`/guilds/${this.props.guildId}/set`).then(response => {
                this.retrieveServerInformation();
                Modal.unmount();
            });
        }
        
        Modal.mount(<Modal title={`Reset ${this.state.guild.name}`} cancelable={true} renderBack={true} width={400}>
            <div className="containerVertical containerPadded">
                <p>All configuration will be reset as if {CONFIG.bot.name} joined the server for the first time.</p>
                <p>You'll need to configure {CONFIG.bot.name} in {this.state.guild.name} again once it's been reset.</p>
                <a className="button destructive" onClick={performReset}>Reset {CONFIG.bot.name} in {this.state.guild.name}</a>
            </div>
        </Modal>)
    }
    
    leaveServer() {
        let performLeave = (eraseSettings) => {
            Fetch.delete(`/guilds/${this.props.guildId}?eraseSettings=${eraseSettings}`).then(response => {
                this.retrieveServerInformation();
                Modal.unmount();
            });
        }
        
        Modal.mount(<Modal title={`Leave ${this.state.guild.name}`} cancelable={true} renderBack={true} width={400}>
            <div className="containerVertical containerPadded">
                <p>{CONFIG.bot.name} will leave {this.state.guild.name}. To use {CONFIG.bot.name} again, you'll need to add it back to the server.</p>
                <Cmdlink className="destructive" title={`Leave ${this.state.guild.name}`} description={`Your settings won't be erased`} onClick={performLeave.bind(this, false)} />
                <Cmdlink className="destructive" title={`Leave ${this.state.guild.name} and erase settings`} description={`You'll need to configure ${CONFIG.bot.name} again should you want to use it.`} onClick={performLeave.bind(this, true)} />
                <p>TIP: You can also get {CONFIG.bot.name} to leave the server without erasing settings by kicking it from the server.</p>
            </div>
        </Modal>)
    }
    
    getTextChannels() {
        let els = [];
        els.push(<option value="disabled">Disabled</option>);
        
        let channels = [];
        let categories = {
            uncatg: []
        };
        let categoryDescriptors = [{
            name: "Uncategorised",
            id: "uncatg"
        }];
        for (let channel of this.state.channels.category) {
            categoryDescriptors[channel.position] = channel;
            categories[channel.id] = [];
        }
        
        //Go through it twice to order it correctly
        for (let channel of this.state.channels.text) {
            channels[channel.position] = channel;
        }
        for (let channel of channels) {
            if (!channel) continue;
            let el = <option value={channel.id} key={channel.id}>#{channel.name}</option>;
            if (channel.parent) {
                categories[channel.parent].push(el);
            } else {
                categories.uncatg.push(el);
            }
        }
        
        for (let category of categoryDescriptors) {
            if (!category) continue;
            if (categories[category.id].length > 0) {
                els.push(<optgroup title={category.name} key={category.id}>
                    {categories[category.id]}
                </optgroup>)
            }
        }
        
        return els;
    }
    
    render() {
        if (this.state.currentPage === "loader") {
            return <LoadingPane />
        } else if (this.state.currentPage === "error") {
            return <div className="containerVertical grow">
                <Heading title={`Add ${CONFIG.bot.name}`} />
                <div className="containerVertical containerCenter grow">
                    <h1>Add {CONFIG.bot.name}</h1>
                    <p>To use {CONFIG.bot.name} in this server, add {CONFIG.bot.name} to it first.</p>
                    <a className="button" onClick={this.addQuad.bind(this)}>Add {CONFIG.bot.name} to the server</a>
                </div>
            </div>
        } else {
            return <div className="containerVertical grow">
                <Heading title={this.state.guild.name} />
                <div className="containerScrollable">
                    <PaneGroup title="Prefix">
                        <p>Set the prefix for {CONFIG.bot.name} commands.</p>
                        <input type="text" name="prefix" value={this.state.settings.prefix} onChange={this.onPrefixChange.bind(this)} onBlur={this.setGuildSetting.bind(this)} />
                        <p>Example usage: {this.state.settings.prefix}ping</p>
                    </PaneGroup>
                    <PaneGroup title="Logs">
                        <p>Set the channels {CONFIG.bot.name} should post informational messages in.</p>
                        <div className="containerHorizontal">
                            Alerts:&nbsp;
                            <select className="grow" name="alerts" value={this.state.settings.alerts} onChange={this.setGuildSetting.bind(this)}>
                                {this.getTextChannels()}
                            </select>
                        </div>
                        <div className="containerHorizontal">
                            Chat Logs:&nbsp;
                            <select className="grow" name="chatlogs" value={this.state.settings.chatlogs} onChange={this.setGuildSetting.bind(this)}>
                                {this.getTextChannels()}
                            </select>
                        </div>
                    </PaneGroup>
                    <PaneGroup title="Autobans">
                        <p>Users joining {this.state.guild.name} who have any of the following patterns in their usernames will automatically be banned by {CONFIG.bot.name}. Put every pattern you wish to ban on a separate line.</p>
						<textarea style={{resize: "vertical"}} rows={4} className="grow" name="autobans" value={this.state.settings.autobans} onChange={this.onAutobansChange.bind(this)} onBlur={this.setGuildSetting.bind(this)} />
                    </PaneGroup>
                    <PaneGroup title="Danger">
                        <p>Ensure absolute certainty and exercise caution before you hit one of these buttons. They're not for the faint of heart!</p>
                        <Cmdlink className="destructive" title={`Reset ${CONFIG.bot.name}`} description={`Reset ${CONFIG.bot.name} back to the default settings.`} onClick={this.resetServer.bind(this)} />
                        <Cmdlink className="destructive" title={`Leave ${this.state.guild.name}`} description={`Requests ${CONFIG.bot.name} to leave the server.`} onClick={this.leaveServer.bind(this)} />
                    </PaneGroup>
                </div>
            </div>
        }
    }
}

export default GuildSettings;
