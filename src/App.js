import * as noun_store from "./data/nouns"
import * as adjective_store from "./data/adjectives"
import * as articles_store from "./data/articles"
import * as adjectives_endings_store from "./data/adjective_endings"
import React from 'react';
import copyIcon from './copy_to_clipboard.svg';
import './App.css';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
        randomAdjektiv: null,
        manualAdjektiv: null,
        randomNomen: null,
        manualNomen: null,
        kasus: null,
        artikel: null,
        genus: null,
        resultArtikel: null,
        resultAdjektive: null,
        manualResultAdjektive: null,
        resultNomen: null,
        autocompleteAdjektive: true, // when true if all vars are set the app will set the result artikel value
        showTranslation: true // when true, it will show the English translation of the random picked adjective and noun
    };

    this.adjektiveList = this.makeWeighted(adjective_store.adjectives);
    this.nounList = this.makeWeighted(noun_store.nouns);

    this.articlesDict = articles_store.articles_dict;
    this.adjectiveEndingsDict = adjectives_endings_store.adjective_endings_dict; 
  }

  // Event handlers

  getRandomAdjektivClicked() {
    let randomAdjektiv = this.getRandomFromArray(this.adjektiveList);

    console.log("randomAdjektiv: "+randomAdjektiv);

    this.setState({
      manualAdjektiv: null, // whatever could have been written manually is cleared
      randomAdjektiv: randomAdjektiv
    })
  }

  onInputArtikel(manualArtikel) {
    this.setState({
      randomAdjektiv: null, //whatever random value was selected is cleared
      manualAdjektiv: manualArtikel
    })
  }

  getRandomNomenClicked() {
    let randomNomen = this.getRandomFromArray(this.nounList);

    console.log("randomNomen: "+randomNomen);

    // If genus plural is now selected we keep it
    // otherwise we set it to the genus from the newly chosen noun
    let genus = (this.state.genus == "plural") ? "plural" : this.extractGenus(randomNomen);

    this.setState({
      manualNomen: null, // whatever could have been written manually is cleared
      randomNomen: randomNomen,
      genus: genus
    });

    return randomNomen;
  }

  onInputNomen(manualNomen) {
    this.setState({
      randomNomen: null, //whatever random value was selected is cleared
      manualNomen: manualNomen
    })
  }

  kasusSelected(einKasus) {
    this.setState({
      kasus: einKasus
    })
  }

  artikelSelected(einArtikel) {
    this.setState({
      artikel: einArtikel
    })
  }

  genusSelected(einGenus) {
    this.setState({
      genus: einGenus
    })
  }

  onInputResultAdjektiv(manualResult) {
    this.setState({
      manualResultAdjektive: manualResult
    })
  }

  autocompleteChange() {
    this.setState({autocompleteAdjektive: !this.state.autocompleteAdjektive});
  }

  showTranslationChange() {
    this.setState({showTranslation: !this.state.showTranslation});
  }

  onCopyToClipboard() {
    let result = this.findResultArtikel() + " " + this.findResultAdjektiv() + " " + this.findResultNomen();
    navigator.clipboard.writeText(result);
  }

  allRandomVarsClick() {
    // get a random adjective
    this.getRandomAdjektivClicked();

    // get a random noun
    let randomNomen = this.getRandomNomenClicked();

    // get random kasus
    let kasus = this.getRandomFromArray(["nominativ", "akkusativ", "dativ"]); // I am not learning Genitiv yet :)

    // get random type of artikel
    let artikel = this.getRandomFromArray(["definit", "indefinit", "ohne"]);

    // get random singular / plural
    let newGenus = this.getRandomFromArray(this.makeWeighted([this.extractGenus(randomNomen)+";3", "plural;1"]));

    this.setState({
      kasus: kasus,
      artikel: artikel,
      genus: newGenus,
      manualResultAdjektive: "s",
      manualAdjektiv: null
    });  
  }

  // Helper functions

  getRandomFromArray(array) {
    console.log("Choosing random from "+array.length+" options.");
    let randomIndex = Math.floor(Math.random()*array.length);
    return array[randomIndex];
  }

  // This will get something like "aalglatt;slippery"
  // so we want the first part, the German version of it
  extractAdjektive(oneElement) {
    if (oneElement == null) return "";

    let parts = oneElement.split(";");
    return parts[0];
  }

  // This will get something like "aalglatt;slippery"
  // so we want the second part, the English version of it
  extractAdjektiveTranslation(oneElement) {
    if (oneElement == null) return "";

    let parts = oneElement.split(";");
    return parts[1];
  }

  // This will get something like "Time;Die Zeit;Die Zeiten"
  // so we want the middle part, the German version of it.
  // also, we will strip out the article
  extractNomen(oneElement) {
    if (oneElement == null) return "";

    let parts = oneElement.split(";");
    return parts[1].replace(/(Das\s|Der\s|Die\s)/, "");
  }

  // This will get something like "Time;Die Zeit;Die Zeiten"
  // we want the last part
  // also, we will strip out the article
  extractPluralNomen(oneElement) {
    if (oneElement == null) return "";

    let parts = oneElement.split(";");
    return parts[2].replace(/(Die\s)/, "");
  }

  // This will get something like "Time;Die Zeit;Die Zeiten"
  // the middle part, is the noun we want.
  // We will match the article which is the first part of it
  extractGenus(oneElement) {
    if (oneElement == null) return null;

    let parts = oneElement.split(";");
    let nomen = parts[1];
    let article = nomen.substr(0, 3);

    switch(article) {
      case "Der":
        return "mask";
      case "Die":
        return "fem";
      case "Das":
        return "neu";
      default:
        throw new TypeError('Woah, was ist das? '+article);
    }
  }

  // This will get something like "Time;Die Zeit;Die Zeiten"
  // so we want to take the first part
  extractNomenTranslation(oneElement) {
    if (oneElement == null) return null;

    let parts = oneElement.split(";");
    return parts[0];
  }

  // We get an array where each element is a string with ; separated values
  // the last element after split is the weight.
  // What we do is place N = weight elements in the resulting array,
  // so the higher the weight, the more chances this element will have to come up
  // on a random pick 
  makeWeighted(array) {
    console.log("Before weighted process: "+array.length);
    let weightedArray = [];

    for (let i = 0; i < array.length; i++) {
      let element = array[i];
      let weightSeparator = element.lastIndexOf(";");
      let arrValue = element.substr(0, weightSeparator);
      let weight = parseInt(element.substr(weightSeparator+1));

      //sanity check
      if (weight < 1) throw new TypeError('Weight is fucked: '+element);

      for (let weightIter = 0; weightIter < weight; weightIter++) {
        weightedArray.push(arrValue);
      }
    }

    console.log("After weighted process: "+weightedArray.length);

    return weightedArray;
  }

  // Calculating 'The Result'

  findResultArtikel() {
    let result = "?";

    if (this.state.artikel == "ohne") {
      result = "X";
    } else if (this.state.kasus != null && this.state.artikel != null && this.state.genus != null) {
      result = this.articlesDict[this.state.kasus+"-"+this.state.artikel+"-"+this.state.genus];
    }

    return result;
  }

  findResultNomen() {
    let result = "?";

    if (this.state.manualNomen != null) {
      result = this.state.manualNomen;
    } else if (this.state.randomNomen != null) {
      result = (this.state.genus == "plural") 
        ? this.extractPluralNomen(this.state.randomNomen) 
        : this.extractNomen(this.state.randomNomen);
    }

    return result;
  }   

  findResultAdjektiv() {
    let result = "";

    // If I wrote in something it takes priority to a random chosen one  
    let baseAdjektiv = (this.state.manualAdjektiv != null) ? this.state.manualAdjektiv : this.extractAdjektive(this.state.randomAdjektiv);

    // I think I am not contemplating ohne artikel right
    if (this.state.randomAdjektiv != null && this.state.kasus != null && this.state.artikel != null && this.state.genus != null) {
      result = baseAdjektiv + this.adjectiveEndingsDict[this.state.kasus+"-"+this.state.artikel+"-"+this.state.genus];
    }
    
    return result;
  }

  // I will use this to highlight the label 'adjective' green
  // so there is some feedback when article autocomplete is off
  isRightClass() {
    let machineResult = this.findResultAdjektiv();
    return (machineResult == this.state.manualResultAdjektive) ? "right" : "";
  }

  findTranslation() {
    let translationText = "";

    if (!this.state.showTranslation) return "";

    if (this.state.randomAdjektiv != null) {
      translationText += this.extractAdjektiveTranslation(this.state.randomAdjektiv) + " / ";
    } else {
      translationText += "? / "; // translation unknown for the adjective part
    }

    if (this.state.randomNomen != null) {
      translationText += this.extractNomenTranslation(this.state.randomNomen);
    } else {
      translationText += "?"; // translation unknown for the noun part
    }

    return translationText;
  }

  // Main rendering block

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h2>Possible endings</h2>
          <ul className="endings">
                  <li>-e</li>
                  <li>-en</li>
                  <li>-es</li>
                  <li>-er</li>
                  <li>-em</li>
          </ul>
          <hr className="separator"/>
          <h2>The variables</h2>
          <table className="varsTable">
            <tr>
              <th><a href="#" className="randomGet" onClick={() => this.getRandomAdjektivClicked()}>[ get one! ]</a> ein Adjektiv:</th>
              <th><a href="#" className="randomGet" onClick={() => this.getRandomNomenClicked()}>[ get one! ]</a> ein Nomen:</th>
              <th><input type="checkbox" onChange={() => this.showTranslationChange()} checked={this.state.showTranslation} /> Show me the translation</th>
            </tr>
            <tr>
              <td>
                <div contenteditable="true" className="input" onInput={e => this.onInputArtikel(e.currentTarget.textContent)}>{ this.extractAdjektive(this.state.randomAdjektiv) }</div>
              </td> 
              <td>
                <div contenteditable="true" className="input" onInput={e => this.onInputNomen(e.currentTarget.textContent)}>{ this.extractNomen(this.state.randomNomen) }</div>
              </td>
              <td>
                <div className="translation">{ this.findTranslation() }</div>
              </td>
            </tr>
            <tr>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th>der Kasus:</th>
              <th>der Artikel:</th>
              <th>das Genus / Numerus:</th>
            </tr>
            <tr>
              <td>
                <ul>
                  <li><a href="#nominativ" className={this.state.kasus == "nominativ" ? "selected" : ""} onClick={() => this.kasusSelected("nominativ")}>Nominativ</a></li>
                  <li><a href="#akkusativ" className={this.state.kasus == "akkusativ" ? "selected" : ""} onClick={() => this.kasusSelected("akkusativ")}>Akkusativ</a></li>
                  <li><a href="#dativ" className={this.state.kasus == "dativ" ? "selected" : ""} onClick={() => this.kasusSelected("dativ")}>Dativ</a></li>
                  <li><a href="#genitiv" className={this.state.kasus == "genitiv" ? "selected" : ""} onClick={() => this.kasusSelected("genitiv")}>Genitiv</a></li>
                </ul>
              </td>
              <td>
                <ul>
                  <li><a href="#definit" className={this.state.artikel == "definit" ? "selected" : ""} onClick={() => this.artikelSelected("definit")}>Definiter Artikel</a></li>
                  <li><a href="#indefinit" className={this.state.artikel == "indefinit" ? "selected" : ""} onClick={() => this.artikelSelected("indefinit")}>Indefiniter Artikel</a></li>
                  <li><a href="#ohne" className={this.state.artikel == "ohne" ? "selected" : ""} onClick={() => this.artikelSelected("ohne")}>Ohne Artikel</a></li>
                </ul>
              </td>
              <td>
                <ul>
                  <li><a href="#mask" className={this.state.genus == "mask" ? "selected" : ""} onClick={() => this.genusSelected("mask")}>Maskulin</a></li>
                  <li><a href="#fem" className={this.state.genus == "fem" ? "selected" : ""} onClick={() => this.genusSelected("fem")}>Feminin</a></li>
                  <li><a href="#neu" className={this.state.genus == "neu" ? "selected" : ""} onClick={() => this.genusSelected("neu")}>Neutral</a></li>
                  <li><a href="#plural" className={this.state.genus == "plural" ? "selected" : ""} onClick={() => this.genusSelected("plural")}>Plural</a></li>
                </ul>
              </td>
            </tr>
          </table>
          <hr className="separator"/>
          <h2>The result</h2>
          <table className="exampleBox">
            <tr>
              <td className="artikelPart">
                <div className="val">{ this.findResultArtikel() }</div>
                <div className="label">artikel</div>
              </td>
              <td className="adjectivePart">
                <div contenteditable="true" className="val input" onInput={e => this.onInputResultAdjektiv(e.currentTarget.textContent)}>{ (this.state.autocompleteAdjektive) ? this.findResultAdjektiv() : null }</div>
                <div className={"label " + this.isRightClass()}>adjective</div>  
              </td>
              <td className="nomenPart">
                <div className="val">{ this.findResultNomen() }</div>
                <div className="label">nomen</div>  
              </td>
              <td>
                <a href="#copy" className="copy-icon" onClick={() => this.onCopyToClipboard()}><img src={copyIcon} alt="Copy to clipboard" width="20" height="20" /></a>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <br/>
                <br/>
                <input type="checkbox" onChange={() => this.autocompleteChange()} /> Do not autocomplete the artikel, I want to practise! 
                <br/>
                <br/>
                <input type="button" value="ALL NEW RANDOM VARS" className="randomAll" onClick={() => this.allRandomVarsClick()}/>

              </td>
            </tr>
          </table>
        </header>
      </div>
    );
  }  
}

export default App;
