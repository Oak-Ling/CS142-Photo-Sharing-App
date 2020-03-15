import React, {Component} from 'react';
import axios from "axios";
import {Divider, ListItem, ListItemText, Avatar} from "@material-ui/core";
import {Link} from "react-router-dom";

class UserComments extends Component {
  constructor(props) {
    super(props);
    this.state = {
      photoList: null,
      user: null,
    };
  }

  componentDidMount() {
    const userId = this.props.match.params.userId;
    axios.get(`/user/${userId}`).then(response => {
      this.props.setContext(`Comments of ${response.data.first_name} ${response.data.last_name}`);
      this.setState({
        user: response.data,
      });
    }).catch(error => {
      console.log(error.message);
    });
    axios.get('/photo/list').then(response => {
      this.setState({
        photoList: response.data,
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
        this.props.setContext(`Comments of ${response.data.first_name} ${response.data.last_name}`);
        this.setState({
          user: response.data,
        });
      }).catch(error => {
        console.log(error.message);
      });
    }
  }

  render() {
    const userId = this.props.match.params.userId;
    const {photoList} = this.state;
    return (
      <div>
        {
          photoList ?
            photoList.map((photo) => {
              return photo.comments.map((comment, idx) => {
                if (comment) {
                  if (comment.user_id === userId) {
                    return (
                      <div key={idx}>
                        <ListItem button component={Link} to={`/photos/${photo.user_id}`} >
                          <Avatar alt={photo.file_name} src={`../../images/${photo.file_name}`} />
                          <ListItemText primary={comment.comment} />
                        </ListItem>
                        <Divider />
                      </div>
                    );
                  }
                }
              });
            }) : null
        }
      </div>
    );
  }
}

export default UserComments;