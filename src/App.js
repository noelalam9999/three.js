import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">

      <div id="texture-picker">
        <div className="option" id="Bricks060" data-id="0"></div>
        <div className="option" id="Bricks071" data-id="1"></div>
        <div className="option" id="PaintedPlaster002" data-id="2"></div>
        <div className="option" id="PaintedPlaster003" data-id="3"></div>
        <div className="option" id="Plaster004" data-id="4"></div>
      </div>
      
      <div id="UI">
        <div className="two">
          <h1 id="product-title">Product Name
            <span id="product-description">Lorem ipsum dolor sit amet</span>
          </h1>
        </div>
        <i className="info far fa-question-circle fa-4x"></i> 
        {/**<button className="info">AAA</button>*/}
        <div id="sidebar">
          <div>
            <i className="close far fa-times-circle fa-4x"></i>
            <h1>ABOUT</h1>
            <div className="bodyText">
              <p>This is an interior visualization demo. It aims to illustrate how <strong> WebGL </strong> and <strong> WebVR </strong> offer new ways to showcase and customize products on the Web.</p>
              <p>This demo features physically-based materials to accurately represent surfaces and objects. Since it's running in real-time 3D, you are able to inspect objects from every angle, and even customize their appearance. For the most immersive experience, you can view it in VR in your browser.</p>
              <p>We created this project from the ground up. All of the following was done by our studio: UX/UI design, 3D modeling and texturing, WebGL and web development.</p>
              <p>Interested in hiring us to build something awesome? <strong><ins> Get in touch. </ins></strong> </p>

              <div className="social-media">
                <i className="fab fa-twitter"></i>
                <i className="fab fa-facebook-f"></i>
                <i className="fab fa-linkedin-in"></i>
              </div>

              <p>Made by <strong><ins> Little Workshop</ins></strong>, a digital studio specialized in WebGL experiences. <ins>Get in touch</ins></p>
            </div>
          </div>
        </div>
      </div>

      <div id="viewer-3d"></div>

      <div id="loading">
        <div className="loading">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <span id="txt-loading">loading...</span>
      </div>
    </div>
  );
}

export default App;
