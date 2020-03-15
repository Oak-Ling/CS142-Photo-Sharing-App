import React from 'react';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  Fab,
}
  from '@material-ui/core';
import './userList.css';
import {Link} from "react-router-dom";
import axios from 'axios';
import {withStyles} from "@material-ui/core/styles";
import { red, green } from '@material-ui/core/colors';

const useStyles = theme => ({
  fabGreen: {
    color: theme.palette.common.white,
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[600],
    },
  },
  fabRed: {
    color: theme.palette.common.white,
    backgroundColor: red[500],
    '&:hover': {
      backgroundColor: red[600],
    },
  },
});

/**
 * Define UserList, a React component of CS142 project #5
 */
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userList: null,
      photoList: null,
    };
  }

  fetchData = () => {
    axios.get(`/user/list`).then(response => {
      this.setState({
        userList: response.data,
      });
      axios.get(`/photo/list`).then(response => {
        this.setState({
          photoList: response.data,
        });
      }).catch(error => {
        console.log(error.message);
      });
    }).catch(error => {
      console.log(error.message);
    });
  };

  componentDidMount() {
    if (this.props.userIsLoggedIn) {
      const {userList, photoList} = this.state;
      if (!userList || !photoList) {
        this.fetchData();
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userIsLoggedIn !== this.props.userIsLoggedIn) {
      if (this.props.userIsLoggedIn) {
        const {userList, photoList} = this.state;
        if (!userList || !photoList) {
          this.fetchData();
        }
      } else {
        this.setState({
          userList: null,
          photoList: null,
        });
      }
    }
  }

  countPhotos(userId) {
    let count = 0;
    this.state.photoList.forEach((photo) => {
      if (photo.user_id === userId) {
        count++;
      }
    });
    return count;
  }

  countComments(userId) {
    let count = 0;
    this.state.photoList.forEach((photo) => {
      photo.comments.forEach((comment) => {
        if (comment.user_id === userId) {
          count++;
        }
      });
    });
    return count;
  }

  render() {
    const {userList} = this.state;
    const {classes, checked, userIsLoggedIn} = this.props;
    return (
      <div>
        {
          userIsLoggedIn ?
            <div>
              <Typography variant="h4">
                User List
              </Typography>
              <List component="nav">
                {
                  userList ?
                    userList.map((user, index) => {
                      return (
                        <div key={index}>
                          <div className="cs142-userList-container">
                            <ListItem button component={Link} to={`/users/${user._id}`} className="cs142-userList-listItem">
                              <ListItemText primary={`${user.first_name} ${user.last_name}`} />
                            </ListItem>
                            {
                              checked ?
                                <div className="cs142-userList-container">
                                  <Fab size="small" aria-label="photo counts"
                                       className={classes.fabGreen} component={Link}
                                       to={`/photos/${user._id}`}
                                  >
                                    {this.countPhotos(user._id)}
                                  </Fab>
                                  <Fab size="small" aria-label="comment counts"
                                       className={classes.fabRed} component={Link}
                                       to={`/comments/${user._id}`}
                                  >
                                    {this.countComments(user._id)}
                                  </Fab>
                                </div> : null
                            }
                          </div>
                          <Divider />
                        </div>

                      )
                    }) : null
                }
              </List>
            </div> : null
        }
      </div>
    );
  }
}
export default withStyles(useStyles)(UserList);
