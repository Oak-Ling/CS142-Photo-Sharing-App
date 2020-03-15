import React from 'react';
import axios from "axios";
import {
  List, IconButton, ListItem, Avatar, Button, Divider, Typography,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import Modal from 'react-modal';
import {Link} from "react-router-dom";

const customStyles = {
  content : {
    top                   : '56%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

class FavoriteList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      favorites: null,
      modalIsOpen: false,
      fileName: "",
      dateTime: "",
      userId: "",
    };
  }

  componentDidMount() {
    const {user} = this.props;
    Modal.setAppElement('body');
    if (user !== null) {
      this.props.setContext(`Favorites of ${user.first_name} ${user.last_name}`);
    } else {
      this.props.setContext(`Favorite List`);
    }
    this.fetchFavoriteList();
  }

  fetchFavoriteList = () => {
    axios.get(`/favorites`).then(response => {
      this.setState({
        favorites: response.data,
      });
    }).catch(error => {
      console.log(error.response.data);
    });
  };

  handleDeleteBtn = (photo) => {
    let url = `/favorite/${photo._id}`;
    axios.delete(url).then(response => {
      console.log(response.data);
      this.fetchFavoriteList();
    }).catch (error => {
      alert("delete favorite photo failed");
      console.log(error.response.data);
    });
  };

  openModal = (file_name, date_time, user_id) => {
    this.setState({
      modalIsOpen: true,
      fileName: file_name,
      dateTime: date_time,
      userId: user_id,
    });
  };

  afterOpenModal = () => {
    // references are now sync'd and can be accessed.
    this.subtitle.style.color = '#f00';
  };

  closeModal = () => {
    this.setState({
      modalIsOpen: false,
    });
  };

  convertTime(time) {
    let pos = time.indexOf('.');
    let replaced = time.replace(/[A-Z]/g, function(){
      return " ";
    });
    return replaced.slice(0, pos);
  }

  displayFavoriteList() {
    const {favorites} = this.state;
    if (favorites === null) {
      return null;
    } else if (favorites.length === 0) {
      return (
        <Typography variant="body2" color="textPrimary">
          no favorites yet
        </Typography>
      );
    }
    return favorites.map((photo, index) => {
      return (
        <div key={index}>
          <ListItem>
            <Avatar
              alt={photo.file_name}
              src={"../../images/"+ photo.file_name}
              onClick={() => {
                this.openModal(photo.file_name, photo.date_time, photo.user_id);
              }}
            />
            <Typography variant="body2" color="inherit" style={{marginLeft:"10px"}}>
              {photo.file_name}
            </Typography>
            <IconButton
              aria-label="Delete favorites"
              onClick = {() => {
                this.handleDeleteBtn(photo);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </ListItem>
          <Divider />
        </div>
      );
    });
  }

  render() {
    const {modalIsOpen, fileName, dateTime, userId} = this.state;
    return (
      <div>
        <Typography variant="h5" color="inherit">
          Favorite List
        </Typography>
        <List component="nav">
          { this.displayFavoriteList() }
        </List>
        <Modal
          isOpen={modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          <h2 ref={_subtitle => (this.subtitle = _subtitle)}>{fileName}</h2>
          <img alt={fileName} src={"../../images/"+ fileName} style={{maxHeight:"300px"}} />
          {/*<Typography variant="body2" color="textPrimary" className="cs142-modal-time">*/}
          {/*  {`Photo by: ${this.convertTime(photo.date_time)}`}*/}
          {/*</Typography>*/}
          <Typography variant="body2" color="textPrimary" className="cs142-modal-time">
            {`Created: ${this.convertTime(dateTime)}`}
          </Typography>
          <div className="cs142-modal-container">
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to={`/photos/${userId}`}
            >
              Photo Detail
            </Button>
            <Button variant="outlined" color="primary"
                    onClick={this.closeModal}
            >
              close
            </Button>
          </div>
        </Modal>
      </div>
    );
  }
}

export default FavoriteList;