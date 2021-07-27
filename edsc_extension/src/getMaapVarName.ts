/**
 * File contains functionality to determine if the declaration of ipycmc.MapCMC() is present in the user's 
 * Notebook. It also extracts the variable name of the declaration of ipycmc.MapCMC() if it is present.
 * Lastly, it prints info messages to the user's Notebook. 
 * 
 * @author Grace Llewellyn, grace.a.llewellyn@jpl.nasa.gov
 */

import { NotebookActions } from '@jupyterlab/notebook';
import { INotification } from "jupyterlab_toastify";

/**
   * The goal of this function is to return the variable name of ipycmc.MapCMC(). It does this by calling the function
   * to extract the maap variable name. It searches up the notebook first and then down the notebook if no variable name
   * was found. It assumes that findMaapVarName leaves the notebook in the same active state that it received it. 
   * It inserts the code to create start CMC into the notebook if no variable names are found.
   * 
   * @param current  Current notebook widget
   * 
   * @returns The maap variable name or w as the default if it cannot be found
   */
export function getMaapVarName(current: any) {
    var maapVarNameAbove = findMaapVarName(current, true);
    if (maapVarNameAbove != null) {
      return maapVarNameAbove;
    } else {
      var maapVarNameBelow = findMaapVarName(current, false);
      if (maapVarNameBelow != null) {
        return maapVarNameBelow;
      } else {
        // if instance of maap cannot be found, paste it into a cell yourself
        NotebookActions.insertBelow(current.content);
        NotebookActions.paste(current.content);
        current.content.activeCell.model.value.text = "from maap.maap import MAAP\nmaap = MAAP\n\nimport ipycmc\nw = ipycmc.MapCMC()\nw";
        NotebookActions.run(current.content);
        return "w";
      }
    }
}

/**
   * The goal of this function is to extract the variable name of ipycmc.MapCMC(). It does not rely on the ipycmc package
   * name because the user can rename the package. In order to instantiate it though, it must call .MapCMC() so the code looks
   * up first on the notebook then down in a separate function call. When .MapCMC() is found, the variable name to the right 
   * of the nearest = and before the next new line is extracted and returned. This function does this by changing the active cell
   * in the notebook one cell up or down until the active cell id repeats or .MapCMC() is found. Returns the notebook in the same
   * state that it got it (same active cell)
   * 
   * @param current  Current notebook widget
   * @param checkAbove  Indicates if the notebook should check above or below the current active cell. If true, checks above 
   *                    the current active cell and otherwise for false
   * 
   * @returns The maap variable name or null if it cannot be found
   */
function findMaapVarName(current: any, checkAbove: boolean) {
    var iterationsUp = 0;
    var nameMaapVar = null; 
    var lastCellId = 0;
    while(true) {
      var cellCode = current.content.activeCell.model.value.text;
      var index = cellCode.indexOf(".MapCMC()");
      // If you found the variable name
      if (index!=-1) {
        cellCode = cellCode.substring(0, index);
        nameMaapVar = cellCode.substring(cellCode.lastIndexOf("="), cellCode.lastIndexOf("\n")).trim();
        break;
      }
      if (current.content.activeCell.model.id == lastCellId) {
       break;
      }
      lastCellId = current.content.activeCell.model.id;
      moveNotebookActiceCellUpOrDown(checkAbove, current);
      iterationsUp ++;
    }
    revertNotebookOriginalActiveCell(iterationsUp, checkAbove, current);
    return nameMaapVar;
 }

  /**
  * Moves the active cell of the notebook one up or one down
  * 
  * @param moveUp True if the active cell should be moved up one and false if move down one
  * @param current  Current notebook widget
  */
 function moveNotebookActiceCellUpOrDown(moveUp: boolean, current: any) {
   if (moveUp) {
     NotebookActions.selectAbove(current.content);
   } else {
     NotebookActions.selectBelow(current.content);
   }
 }

 /**
  * Reverts the notebook to its original state meaning that the same cell that started active is now active. 
  * 
  * @param iterationsUp Indicates how many times the active cell needs to be moved up or now to reach the original 
  *                     active cell
  * @param checkAbove Indicates if the notebook should be moved down or up to return to the original active cell
  * @param current  Current notebook widget
  */
 function revertNotebookOriginalActiveCell(iterations: number, moveUp: boolean, current: any) {
   var count = 0;
    while(count < iterations) {
     moveNotebookActiceCellUpOrDown(!moveUp, current);
       count++;
    }
 }

 
 /**
  * Prints the info messages to the user that were generated when creating the load_geotiffs function call
  * 
  * @param response Response from the createLoadGeotiffsFcnCall file that contains the info messages to show to the user
  *                 about why certain files were excluded when creating the load_geotiffs function call 
  */
 export function printInfoMessage(response: any) {
     // Print error messages (only 5 max)
     if (response.errors) {
        var errors = response.errors.split("|");
        var iterations = 0;
        for (let error of errors) {
          INotification.info(error);
          iterations++;
          if (iterations >= 5) {
            break;
          }
        }
      }
 }