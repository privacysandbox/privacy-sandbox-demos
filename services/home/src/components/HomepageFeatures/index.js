import React from "react"
import clsx from "clsx"
import styles from "./styles.module.css"

const FeatureList = [
  {
    title: "Demonstrations of Privacy Sandbox APIs",
    Svg: require("@site/static/img/home-hero-user.svg").default,
    description: <>Examples of applications using combinations of Privacy Sandbox APIs across multiple services.</>
  },
  {
    title: "Walkthrough business use cases",
    Svg: require("@site/static/img/padlock-information.svg").default,
    description: <>Showcase the major business use cases from adtech industry and more. Quickly adapt to a web ecosystem without 3rd party cookies.</>
  },
  {
    title: "Deploy & Run anywhere",
    Svg: require("@site/static/img/shield-information.svg").default,
    description: <>Makes local development easy by pre configured Valid domain/certificates and Origin Trials token embedding.</>
  }
]

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
