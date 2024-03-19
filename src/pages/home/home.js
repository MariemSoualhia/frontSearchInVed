// Dans votre composant React
import React, { useState, useEffect } from "react";
import Navigation from "../navigation/navigation";
const Home = () => {
  const [bfmtvContent, setBFMTVContent] = useState("");

  useEffect(() => {
    fetch("/bfmtv")
      .then((res) => res.text())
      .then((data) => {
        console.log("first test", data); // Vérifiez le contenu dans la console
        setBFMTVContent(data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Contenu de BFMTV</h1>
      <Navigation />
      <div>
        <h2>Titre de la vidéo</h2>
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/igog7PSs_Gs"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  );
};

export default Home;
