import React from 'react';
import {
  AppBar, Checkbox, FormControlLabel, Toolbar, Typography, Button,
} from '@material-ui/core';
import axios from "axios";
import './TopBar.css';
import {Link} from "react-router-dom";

/**
 * Define TopBar, a React component of CS142 project #5
 */
class TopBar extends React.Component {
  constructor(props) {
    super(props);
  }

  handleUploadButtonClicked = (e) => {
    e.preventDefault();
    if (this.uploadInput.files.length > 0) {
      // Create a DOM form and add the file to it under the name uploadedphoto
      const domForm = new FormData();
      domForm.append('uploadedphoto', this.uploadInput.files[0]);
      axios.post('/photos/new', domForm)
        .then((res) => {
          console.log(res.data);
          alert('post new photo successfully');
          this.props.handleUpload();
        })
        .catch(err => {
          alert(`POST ERR: ${err.response.data}`);
          console.log(`POST ERR: ${err.response.data}`);
        });
    } else {
      alert('No file chosen');
    }
  };

  render() {
    return (
      <div className="cs142-topbar-root">
        <AppBar className="cs142-topbar-appBar" position="absolute">
          <Toolbar>
            {
              this.props.userIsLoggedIn ?
                <div id="cs142-topbar-container">
                  <Typography variant="h5" color="inherit" className="cs142-topbar-welcome">
                    Hi {this.props.user ? this.props.user.first_name : null}
                  </Typography>
                  <Button
                          variant="contained"
                          color="primary"
                          component={Link}
                          to="/favorites"
                  >
                    My favorite
                  </Button>
                  <Button className="cs142-topbar-logout" color="inherit" onClick={this.props.handleLogout}>
                    logout
                  </Button>
                  <Typography variant="h6" color="inherit" className="cs142-topbar-version">
                    {this.props.version}
                  </Typography>
                  <FormControlLabel className="cs142-topbar-checkbox"
                    control={
                      <Checkbox checked={this.props.checked} onChange={this.props.handleChange} />
                    }
                    label={
                      <Typography variant="h6" color="inherit" className="cs142-topbar-checkbox-label">
                        Advanced
                      </Typography>
                    }
                  />
                  <form className="cs142-topbar-form" noValidate onSubmit={this.handleUploadButtonClicked}>
                    <input
                      type="file"
                      accept="image/*"
                      className="cs142-topbar-input"
                      ref={(domFileRef) => { this.uploadInput = domFileRef; }}
                    />
                    <Button className="cs142-topbar-upload"
                            variant="contained"
                            color="primary"
                            type="submit"
                    >
                      Add Photo
                    </Button>
                  </form>
                  <Typography variant="h5" color="inherit" className="cs142-topbar-user">
                    {this.props.appContext}
                  </Typography>
                </div> :
                <Typography variant="h5" color="inherit">
                  Please Login
                </Typography>
            }
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

export default TopBar;
