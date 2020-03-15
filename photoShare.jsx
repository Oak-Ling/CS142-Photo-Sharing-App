import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid, Paper
} from '@material-ui/core';
import './styles/main.css';
import axios from 'axios';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/UserDetail';
import UserList from './components/userList/UserList';
import UserPhotos from './components/userPhotos/UserPhotos';
import UserComments from './components/userComments/userComments';
import LoginRegister from "./components/loginRegister/loginRegister";
import FavoriteList from "./components/favoriteList/favoriteList";

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      appContext: "",
      checked: false,
      upload: false,
      version: "",
      userIsLoggedIn: Boolean(localStorage.getItem("sessionState")),
      user: null,
    };
  }

  componentDidMount() {
    let userId = localStorage.getItem("sessionState");
    if (userId) {
      let formData = {
        user_id: userId,
      };
      axios.post("/admin/login", formData).then(response => {
        // console.log(response.data);
        this.setState({
          userIsLoggedIn: true,
          user: response.data,
        });
      }).catch(error => {
        localStorage.removeItem("sessionState");
        this.setState({
          userIsLoggedIn: false,
          user: null,
        });
        console.log(error.response.data);
      });
    }
    axios.get("/test/info").then(response => {
      this.setState({
        version: `Version: ${response.data.version}`,
      });
    }).catch(error => {
      console.log(error.message);
    });
  }

  componentDidUpdate() {
    this.getRoot();
  }

  setContext = (newContext) => {
    this.setState({
      appContext: newContext,
    });
  }

  handleChange = () => {
    this.setState(prevState => ({
      checked: !prevState.checked,
    }));
  };

  handleUpload = () => {
    this.setState(prevState => ({
      upload: !prevState.upload,
    }));
  };

  handleLogin = (data) => {
    localStorage.setItem("sessionState", data._id);
    this.setState({
      userIsLoggedIn: true,
      user: data,
    });
  };

  handleLogout = () => {
    axios.post("/admin/logout", {}).then(response => {
      console.log(response.data);
      localStorage.removeItem("sessionState");
      this.setState({
        userIsLoggedIn: false,
        user: null,
      });
    }).catch(error => {
      console.log(error.message);
    });
  };

  getRoot = () => {
    return this.state.userIsLoggedIn ? <Redirect to="/" /> : <Redirect to="/login-register" />
  };

  getLogin = () => {
    return this.state.userIsLoggedIn ? <Redirect to={`/users/${this.state.user._id}`} /> :
      <LoginRegister setContext={this.setContext}
                     handleLogin={this.handleLogin} />
  };

  render() {
    return (
      <HashRouter>
        <div>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TopBar appContext={this.state.appContext}
                      user={this.state.user}
                      version={this.state.version}
                      checked={this.state.checked}
                      userIsLoggedIn={this.state.userIsLoggedIn}
                      handleChange={this.handleChange}
                      handleLogout={this.handleLogout}
                      handleUpload={this.handleUpload}
              />
            </Grid>
            <div className="cs142-main-topbar-buffer"/>
            <Grid item sm={3}>
              <Paper  className="cs142-main-grid-item">
                <UserList setContext={this.setContext} checked={this.state.checked}
                          userIsLoggedIn={this.state.userIsLoggedIn}/>
              </Paper>
            </Grid>
            <Grid item sm={9}>
              <Paper className="cs142-main-grid-item">
                <Switch>
                  <Route path="/login-register"
                         render={this.getLogin}
                  />
                  {
                    this.state.userIsLoggedIn ?
                      <Route path="/users/:userId"
                           render={props => <UserDetail {...props} setContext={this.setContext}

                                            />}
                      />
                    :
                      <Redirect path="/users/:id" to="/login-register" />
                  }
                  {
                    this.state.userIsLoggedIn ?
                      <Route path="/photos/:userId"
                             render={props => <UserPhotos {...props}
                                                          setContext={this.setContext}
                                                          checked={this.state.checked}
                                                          upload={this.state.upload}
                                              />}
                      />
                      :
                      <Redirect path="/users/:id" to="/login-register" />
                  }
                  {
                    this.state.userIsLoggedIn ?
                      <Route path="/comments/:userId"
                             render={props => <UserComments {...props} setContext={this.setContext}
                                                            checked={this.state.checked}/>}
                      />
                      :
                      <Redirect path="/users/:id" to="/login-register" />
                  }
                  {
                    this.state.userIsLoggedIn ?
                      <Route path="/favorites"
                             render={props => <FavoriteList {...props} setContext={this.setContext}
                                                            user={this.state.user} />}
                      />
                      :
                      <Redirect path="/users/:id" to="/login-register" />
                  }
                  {
                    this.state.userIsLoggedIn ?
                      <Route path="/users" component={UserList} />
                      :
                      <Redirect path="/users/:id" to="/login-register" />
                  }
                  <Route render={this.getRoot} />
                </Switch>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </HashRouter>
    );
  }
}

ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
