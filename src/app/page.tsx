"use client";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Home() {

  const { scrollY, scrollYProgress } = useScroll(); // Surveille le défilement vertical

  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 }); // Animation fluide
  // Transforme scrollY [0, 300] en opacité [1, 0]
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);


  const ref = useRef(null); // Référence à l'élément scrollable
  // useScroll sur l'élément ciblé
  const { scrollYProgress: scrollYProgressElement } = useScroll({
    target: ref, // L'élément ciblé
    offset: ["start end", "end start"], // Points de départ et fin du scroll // hna t9olo yabda scroll (ya3ni 0 dyalo) ki yel7a9 tete dyalo m3a end scronn 
    // w yakhlas y3ni egale 1, ki end dyalo yel7a9 start scronn
  });
  // Transformer le scroll en changement d'opacité
  const opacityForElement = useTransform(scrollYProgressElement, [0, 1], [1, 0]);
  const scaleElement = useTransform(
    scrollYProgressElement,
    [0, 0.5, 1], // Étapes du scroll (hors vue -> milieu -> en vue complète)
    [0.5, 1, 0] // Scale correspondant à chaque étape
  );


  const x = useMotionValue(0); // Valeur animée pour X
  // Transformer x en rotation et échelle
  const rotate = useTransform(x, [-200, 200], [-45, 45]); // Rotation de -45° à 45°
  const scale = useTransform(x, [-200, 0, 200], [0.5, 1, 1.5]);
  const color = useTransform(scrollY, [0, 50, 400], ["#f00", "#0f0", "#00f"]);

  return (
    <div className="h-full w-full bg-[url('/background.svg')] bg-cover bg-center bg-no-repeat">
      Hi.. how you doing

      <motion.div
        style={{
          width: 200,
          height: 200,
          background: "blue",
          opacity // Liaison de l'opacité transformée
        }}
      >
        Fais défiler la page 📜
      </motion.div>
      <motion.div
        drag="x" // Permet de glisser horizontalement
        style={{
          width: 150,
          height: 150,
          background: "red",
          x: x,        // Déplacement horizontal
          rotate,   // Rotation dynamique
          backgroundColor: color,
          scale     // Échelle dynamique
        }}
      />
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "5px",
          background: "blue",
          //scaleX:scrollYProgress, // Animation sans fluide
          scaleX, // Animation fluide
          transformOrigin: "left", // Étire depuis la gauche
        }}
      />
      <div className="h-[1000px]"></div>
      <motion.div
        style={{
          height: "300px",
          overflowY: "scroll", // Rendre l'élément scrollable
          border: "2px solid black",
          scale: scaleElement
        }}
        ref={ref}
      >
        <motion.div
          style={{
            height: "600px", // Contenu plus grand que le conteneur
            background: "linear-gradient(#e66465, #9198e5)",
            opacity: opacityForElement, // Changer l'opacité selon le scroll
          }}
        >
          <h2 style={{ padding: "20px", color: "white" }}>Défile moi 👋</h2>
        </motion.div>
      </motion.div>
      <div className="h-[2000px]"></div>
    </div>
  );
}
