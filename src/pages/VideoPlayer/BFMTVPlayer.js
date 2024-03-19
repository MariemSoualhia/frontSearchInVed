// src/components/BFMTVPlayer.js
import React, { useEffect, useState } from "react";

const BFMTVPlayer = () => {
  const [bfmtvContent, setBFMTVContent] = useState("");

  useEffect(() => {
    fetch("/bfmtv")
      .then((res) => res.text())
      .then((data) => setBFMTVContent(data))
      .catch((err) => console.error(err));
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: bfmtvContent }} />;
};

export default BFMTVPlayer;
