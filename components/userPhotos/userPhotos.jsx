import React from 'react';
import {
  Typography, Paper, MobileStepper, Button, Divider,
} from '@material-ui/core';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import PhotoCard from "../photoCard/photoCard";
import './userPhotos.css';
import axios from 'axios';
import {Link} from "react-router-dom";

/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: null,
      user: null,
      mentionDisplay: null,
      activeStep: 0,
      favorites: [],
    };
  }

  componentDidMount() {
    const userId = this.props.match.params.userId;
    axios.get(`/user/${userId}`).then(response => {
      this.props.setContext(`Photos of ${response.data.first_name} ${response.data.last_name}`);
      this.setState({
        user: response.data,
      });
    }).catch(error => {
      console.log(error.message);
    });
    axios.get(`/photosOfUser/${userId}`).then(response => {
      // console.log(response.data);
      this.setState({
        photos: response.data,
      });
    }).catch(error => {
      console.log(error.response.data);
    });
    axios.get(`/user/list`).then(response => {
      this.setState({
        mentionDisplay: response.data,
      });
    }).catch(error => {
      console.log(error.response.data);
    });
    axios.get(`/favorites`).then(response => {
      this.setState({
        favorites: response.data,
      });
    }).catch(error => {
      console.log(error.response.data);
    });
  }

  componentDidUpdate(prevProps) {
    const prevUserId = prevProps.match.params.userId;
    const currUserId = this.props.match.params.userId;
    if (prevUserId !== currUserId) {
      axios.get(`/user/${currUserId}`).then(response => {
        this.props.setContext(`Photos of ${response.data.first_name} ${response.data.last_name}`);
        this.setState({
          user: response.data,
        });
      }).catch(error => {
        console.log(error.message);
      });
      axios.get(`/photosOfUser/${currUserId}`).then(response => {
        this.setState({
          photos: response.data,
        });
      }).catch(error => {
        console.log(error.message);
      });
    }
    if (this.props.upload !== prevProps.upload) {
      this.updateComments();
    }
  }

  updateFavorites = () => {
    axios.get(`/favorites`).then(response => {
      this.setState({
        favorites: response.data,
      });
    }).catch(error => {
      console.log(error.response.data);
    });
  };

  handleNext = () => {
    this.setState(prevState => ({
      activeStep: prevState.activeStep + 1,
    }));
  };

  handleBack = () => {
    this.setState(prevState => ({
      activeStep: prevState.activeStep - 1,
    }));
  };

  convertTime(time) {
    let pos = time.indexOf('.');
    let replaced = time.replace(/[A-Z]/g, function(){
      return " ";
    });
    return replaced.slice(0, pos);
  }

  showAdvancedView() {
    const {photos, activeStep} = this.state;
    if (photos) {
      const maxSteps = photos.length;
      const photo = photos[activeStep];
      const comments = photo.comments;
      return (
        <div>
          <Paper square elevation={0}>
            <Typography variant="body2">{`photo created: ${this.convertTime(photo.date_time)}`}</Typography>
          </Paper>
          <img
            className="cs142-userPhoto-image"
            src={`./images/${photo.file_name}`}
            alt={photo._id}
          />
          <Typography paragraph variant="h6">Comments:</Typography>
          {
            comments ?
              comments.map((obj, index) => {
                return (
                  <div key={index}>
                    <Link to={`/users/${obj.user._id}`} className="cs142-photoCard-link">
                      {`@${obj.user.first_name} ${obj.user.last_name}`}
                    </Link>
                    <Typography variant="body2" color="textSecondary">
                      {`created: ${this.convertTime(obj.date_time)}`}
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
          <MobileStepper
            steps={maxSteps}
            position="static"
            variant="text"
            activeStep={activeStep}
            nextButton={
              <Button size="small" onClick={this.handleNext} disabled={activeStep === maxSteps - 1}>
                Next
                <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button size="small" onClick={this.handleBack} disabled={activeStep === 0}>
                <KeyboardArrowLeft />
                Back
              </Button>
            }
          />
        </div>
      );
    }
    return null;
  }

  showOriginalView() {
    const {photos, user, mentionDisplay, favorites} = this.state;
    return (
      photos ?
        photos.map((photo, index) => {
          let fav = false;
          for (let i = 0; i < favorites.length; i++) {
            if (favorites[i]._id === photo._id) {
              fav = true;
              break;
            }
          }
          // let fav = favorites.indexOf(photo._id) !== -1 ? true : false;
          return (
            <PhotoCard photo={photo} user={user} fav={fav} key={index}
                       mentionDisplay={mentionDisplay} updateComments={this.updateComments}
                       updateFavorites={this.updateFavorites}
            />
          );
        }) : null
    );
  }

  updateComments = () => {
    const {user} = this.state;
    axios.get(`/photosOfUser/${user._id}`).then(response => {
      this.setState({
        photos: response.data,
      });
    }).catch(error => {
      console.log(error.response.data);
    });
  };

  render() {
    return (
      <div>
        <Typography variant="h4">
          User Photos
        </Typography>
        {
          this.props.checked ? this.showAdvancedView() : this.showOriginalView()
        }
      </div>
    );
  }
}

export default UserPhotos;
