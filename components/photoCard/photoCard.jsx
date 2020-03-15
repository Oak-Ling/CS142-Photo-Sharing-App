import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import {
  Avatar, Card, CardActions, CardContent, CardHeader, CardMedia, Divider, IconButton,
  Typography, Collapse, Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import { red } from '@material-ui/core/colors';
import FavoriteIcon from '@material-ui/icons/Favorite';
import ShareIcon from '@material-ui/icons/Share';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import axios from 'axios';
import {Link} from "react-router-dom";
import { MentionsInput, Mention, defaultStyle, defaultMentionStyle } from 'react-mentions';
import { merge } from 'lodash';
import "./photoCard.css";

const useStyles = theme => ({
  root: {
    maxWidth: 500,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  media: {
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  avatar: {
    backgroundColor: red[500],
  },
  favorite: {
    color: red[500],
  },
  inline: {
    display: 'inline',
  },
});

const scrollableStyle = merge({}, defaultStyle, {
  input: {
    overflow: 'auto',
    height: 25,
  },
});

class PhotoCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: true,
      favor: false,
      open: false,
      value: '',
      mentionedUsers: [],
      newComment: '',
    };
  }

  componentDidMount() {
    this.setState({
      favor: this.props.fav,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.fav !== this.props.fav) {
      this.setState({
        favor: this.props.fav,
      });
    }
  }

  convertTime(time) {
    let pos = time.indexOf('.');
    let replaced = time.replace(/[A-Z]/g, function(){
      return " ";
    });
    return replaced.slice(0, pos);
  }

  handleExpandClick = () => {
    this.setState(prevState => ({
      expanded: !prevState.expanded
    }));
  };

  handleFavoriteClick = () => {
    let photoId = this.props.photo._id;
    if (this.state.favor) {
      axios.delete(`/favorite/${photoId}`, {}).then(response => {
        this.setState({
          favor: false,
        });
        console.log(response.data);
      }).catch(error => {
        console.log(error.response.data);
      });
    } else {
      axios.post(`/favorite/${photoId}`).then(response => {
        this.setState({
          favor: true,
        });
        console.log(response.data);
      }).catch(error => {
        console.log(error.response.data);
      });
    }
  };

  setOpen(isOpen) {
    this.setState({
      open: isOpen,
    });
  }

  handleClickOpen = () => {
    this.setOpen(true);
  };

  handleClose = () => {
    this.setOpen(false);
  };

  handleDialogSubmit = (newComment, mentionedUsers) => {
    this.setOpen(false);
    let data = {
      comment: newComment,
      mentionedUsers: mentionedUsers,
    };
    this.setState({
      value: '',
      mentionedUsers: [],
      newComment: '',
    });
    axios.post(`/commentsOfPhoto/${this.props.photo._id}`, data).then(response => {
      if (response.status === 200) {
        this.props.updateComments();
      }
    }).catch(error => {
      if (error.response) {
        console.log(`POST comment err: ${error.response.data}`);
      }
      console.log(error.message);
    });
    axios.post(`/mention/${this.props.photo._id}`, data).then(response => {
      if (response.status === 200) {
        console.log("add mentions to photo successfully");
        // this.props.updateUserDetail();
      }
    }).catch(error => {
      if (error.response) {
        console.log(`POST mention list err: ${error.response.data}`);
      }
      console.log(error.message);
    });
  };

  handleMentionChange = (e) => {
    this.setState({
      value: e.target.value,
    });
  };

  showDialog() {
    const {open, mentionedUsers, newComment} = this.state;
    const {mentionDisplay} = this.props;
    let newUserList = [];
    if (mentionDisplay !== null) {
      mentionDisplay.forEach((user) => {
        let newUser = {
          id: user._id,
          display: `${user.first_name} ${user.last_name}`,
        };
        newUserList.push(newUser);
      });
    }
    return (
      <div className="cs142-photoCard-dialog">
        <Button variant="outlined" color="primary" onClick={this.handleClickOpen}>
          Add new comment
        </Button>
        <Dialog open={open}
                onClose={this.handleClose}
                fullWidth
                aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">New Comment</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Add your new comments here.
            </DialogContentText>
            <TextField
              autoFocus
              multiline
              margin="dense"
              id="comment"
              label="Comment"
              name="comment"
              fullWidth
              onChange = {(event) => {
                this.setState({
                  newComment: event.target.value,
                });
              }}
            />
            <MentionsInput
              value={this.state.value}
              onChange={this.handleMentionChange}
              placeholder={"Mention people using '@'"}
              style={scrollableStyle}
            >
              <Mention
                trigger="@"
                data={newUserList}
                style={defaultMentionStyle}
                appendSpaceOnAdd={true}
                displayTransform={(id, display) => {
                  return `@${display}`;
                }}
                onAdd={(id, display) => {
                  let mentioned = {
                    id: id,
                    display: display,
                  };
                  this.setState({
                    mentionedUsers: [...mentionedUsers, mentioned],
                  });
                }}
              />
            </MentionsInput>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={() => this.handleDialogSubmit(newComment, mentionedUsers)} color="primary">
              Add comment
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  showOriginalView() {
    const { classes, photo, user } = this.props;
    const comments = photo.comments;
    return (
      <Card className={classes.root}>
        <CardHeader
          avatar={
            <Avatar aria-label="initial of user's name" className={classes.avatar}>
              {
                user ?
                `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` : null
              }
            </Avatar>
          }
          title={`photo created: ${this.convertTime(photo.date_time)}`}
        />
        <CardMedia
          component="img"
          className={classes.media}
          title={photo._id}
          image={`../../images/${photo.file_name}`}
        >
        </CardMedia>
        <CardActions>
          <IconButton
            aria-label="add to favorites"
            className={clsx(classes.normal, {
              [classes.favorite]: this.state.favor,
            })}
            onClick={this.handleFavoriteClick}
          >
            <FavoriteIcon />
          </IconButton>
          <IconButton aria-label="share">
            <ShareIcon />
          </IconButton>
          <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: this.state.expanded,
            })}
            onClick={this.handleExpandClick}
            aria-expanded={this.state.expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </IconButton>
        </CardActions>
        <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <div className="cs142-photoCard-container">
              <Typography paragraph variant="h6" className="cs142-photoCard-comment-header">Comments:</Typography>
              {this.showDialog()}
            </div>
            {
              comments.length ?
                comments.map((obj, index) => {
                  return (
                    <div key={index}>
                      <Link to={`/users/${obj.user._id}`} className="cs142-photoCard-link">
                        {`${obj.user.first_name} ${obj.user.last_name}`}
                      </Link>
                      <Typography variant="body2" color="textSecondary">
                        {`created: ${this.convertTime(obj.date_time)}`}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {
                          obj.mentions.length ?
                          obj.mentions.map((user) => {
                            return (`@${user.display} `);
                          }) : null
                        }
                      </Typography>
                      <Typography variant="body2" color="textPrimary">
                        {`${obj.comment}`}
                      </Typography>
                      <Divider />
                    </div>
                  )
                }) :
                <Typography variant="body2" color="textPrimary">
                  no comments
                </Typography>
            }
          </CardContent>
        </Collapse>
      </Card>
    );
  }

  render() {
    return (
      <div>
        {
          this.showOriginalView()
        }
      </div>
    );
  }
}

export default withStyles(useStyles)(PhotoCard);
