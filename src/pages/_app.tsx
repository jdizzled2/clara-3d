import '../styles/global.css';
import "../App.css";

function MyApp(props) {
  // console.log(props);
  const { Component, pageProps } = props;

  return <Component {...pageProps} />;
}

export default MyApp;
