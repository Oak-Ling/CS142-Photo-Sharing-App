import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Paper, withStyles, ListItem, Avatar, ListItemText, Divider,
} from '@material-ui/core';
import './userDetail.css';
import {Link} from "react-router-dom";
import axios from 'axios';

const useStyles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'column',
    '& > *': {
      margin: theme.spacing(1),
    },
  },
});

/**
 * Define UserDetail, a React component of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      mentionList: [],
    };
  }

  showUserDetail(user) {
    return (user ?
      Object.keys(user).map((property) => {
        return (
          <Typography key={property} variant="body2" color="textSecondary" component="p">
            {`${property}: ${user[property]}`}
          </Typography>
        );
      }) : null);
  }

  componentDidMount() {
    const url = `/user/${this.props.match.params.userId}`;
    axios.get(url).then(response => {
      this.props.setContext(`${response.data.first_name} ${response.data.last_name}`);
      this.setState({
        user: response.data,
      });
    }).catch(error => {
      console.log(error.message);
    });
    axios.get(`/mention/${this.props.match.params.userId}`).then(response => {
      this.setState({
        mentionList: response.data,
      });
    }).catch(error => {
      console.log(error.message);
    });
  }

  componentDidUpdate(prevProps) {
    const prevUserId = prevProps.match.params.userId;
    const currUserId = this.props.match.params.userId;
    if (prevUserId !== currUserId) {
      axios.get(`/user/${currUserId}`).then(response => {
        this.props.setContext(`${response.data.first_name} ${response.data.last_name}`);
        this.setState({
          user: response.data,
        });
      }).catch(error => {
        console.log(error.message);
      });
      axios.get(`/mention/${currUserId}`).then(response => {
        this.setState({
          mentionList: response.data,
        });
      }).catch(error => {
        console.log(error.message);
      });
    }
  }

  render() {
    const { user, mentionList } = this.state;
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Paper>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h5">
                {
                  user ?
                    `${user.first_name} ${user.last_name}`
                    : null
                }
              </Typography>
              {
                this.showUserDetail(user)
              }
            </CardContent>
            <div className="cs142-userDetail-container">
              <Link variant="body2"
                    to={`/photos/${this.props.match.params.userId}`}
                    color="primary"
                    className="cs142-userDetail-link"
              >
                Switch to your photos
              </Link>
            </div>
          </Card>
        </Paper>
        <Paper>
          {
            mentionList.length !== 0 ?
              <div>
                <Typography gutterBottom variant="h6" id="cs142-userDetail-text">
                  Mention List
                </Typography>
                {
                  mentionList.map((photo, index) => {
                    return (
                      <div key={index}>
                        <ListItem button component={Link} to={`/photos/${photo.user_id}`} >
                          <Avatar alt={photo.file_name} src={`../../images/${photo.file_name}`} />
                          <ListItemText primary={`photoed by ${photo.author_name}`} />
                        </ListItem>
                        <ListItem component={Link} to={`/users/${photo.user_id}`} >
                          <ListItemText primary={`Go to ${photo.author_name}'s page`} />
                        </ListItem>
                        <Divider />
                      </div>
                    );
                  })
                }
              </div>
            :
              <Typography gutterBottom variant="body1" id="cs142-userDetail-text">
                No people mention you yet :)
              </Typography>
          }
          {/*<Card>*/}
          {/*  <CardContent>*/}

          {/*  </CardContent>*/}
          {/*</Card>*/}
        </Paper>
      </div>
    );
  }
}

export default withStyles(useStyles)(UserDetail);