import React from 'react';
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  FormControlLabel,
  Checkbox,
  Container,
  Box,
  Grid,
  Typography,
  Link,
  withStyles,
} from "@material-ui/core";
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import axios from "axios";

const useStyles = theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
});

class LoginRegister extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showLogin: true,
    };
  }

  handleLoginSubmit = (event) => {
    event.preventDefault();
    let formData = {
      login_name: event.target.login_name.value,
      password: event.target.password.value,
    };
    axios.post("/admin/login", formData).then(response => {
      // console.log(response.data);
      this.props.handleLogin(response.data);
    }).catch(error => {
      alert(error.response.data);
      console.log(error.response.data);
    });
  };

  handleRegisterSubmit = (event) => {
    event.preventDefault();
    let re_enter = event.target.re_enter.value;
    let formData = {
      login_name: event.target.login_name.value,
      password: event.target.password.value,
      first_name: event.target.first_name.value,
      last_name: event.target.last_name.value,
      location: event.target.location.value,
      description: event.target.description.value,
      occupation: event.target.occupation.value,
    };
    if (re_enter !== formData.password) {
      alert("Please enter the same password in both password fields.");
      return;
    }
    Object.keys(formData).forEach(key => {
      if (key === '' && key !== 'location' && key !== 'description' && key !== 'occupation') {
        alert(`Please fill in the ${key} field.`);
      }
    });
    axios.post("/user", formData).then(response => {
      console.log(response.data);
      axios.post("/admin/login", formData).then(response => {
        alert('register successfully');
        this.props.handleLogin(response.data);
      }).catch(error => {
        console.log(error.response.data);
      });
    }).catch(error => {
      alert(error.response.data);
      console.log(error.response.data);
    });
  };

  changeToRegister = () => {
    this.setState({
      showLogin: false,
    })
  };

  changeToLogin = () => {
    this.setState({
      showLogin: true,
    })
  };

  showLoginForm() {
    const { classes } = this.props;
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon/>
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <form className={classes.form} onSubmit={this.handleLoginSubmit} >
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="login_name"
              label="Login Name"
              name="login_name"
              autoComplete="login_name"
              autoFocus
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary"/>}
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="#login-register" variant="body2" onClick={this.changeToRegister}>
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </form>
        </div>
        <Box mt={8}>
        </Box>
      </Container>
    );
  }

  showRegisterForm() {
    const { classes } = this.props;
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <form className={classes.form} onSubmit={this.handleRegisterSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoComplete="login_name"
                  name="login_name"
                  variant="outlined"
                  required
                  fullWidth
                  id="login_name"
                  label="Login Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="re_enter"
                  label="Re-enter password"
                  name="re_enter"
                  type="password"
                  autoComplete="re_enter"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="first_name"
                  name="first_name"
                  variant="outlined"
                  required
                  fullWidth
                  id="first_name"
                  label="First Name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="last_name"
                  label="Last Name"
                  name="last_name"
                  autoComplete="last_name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="location"
                  label="Location"
                  name="location"
                  autoComplete="location"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="description"
                  label="Description"
                  name="description"
                  autoComplete="description"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="occupation"
                  label="Occupation"
                  name="occupation"
                  autoComplete="occupation"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox value="allowExtraEmails" color="primary" />}
                  label="I want to receive inspiration, marketing promotions and updates via email."
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Register Me
            </Button>
            <Grid container justify="flex-end">
              <Grid item>
                <Link href="#/login-register" variant="body2" onClick={this.changeToLogin}>
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </form>
        </div>
        <Box mt={5}>
        </Box>
      </Container>
    );
  }

  render() {
    const {showLogin} = this.state;
    return (
      <div>
        {
          showLogin ? this.showLoginForm() : this.showRegisterForm()
        }
      </div>
    );
  }
}

export default withStyles(useStyles)(LoginRegister);