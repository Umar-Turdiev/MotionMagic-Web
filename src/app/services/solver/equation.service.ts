import { Injectable } from '@angular/core';

import nerdamer from 'nerdamer';
import 'nerdamer/all.min';

export interface Equation {
  equation: string;
  variables: string[];
}

export interface SolvedResult {
  subsitutedEquation: string;
  evaluatedEquation: string;
  finalAnswer: string;
}

@Injectable({
  providedIn: 'root',
})
export class EquationService {
  public preprocessKnowns(knowns: { [key: string]: string }): {
    [key: string]: string;
  } {
    const substitutedKnowns: { [key: string]: string } = {};

    for (const key in knowns) {
      if (knowns.hasOwnProperty(key)) {
        substitutedKnowns[key] = this.substituteEquation(knowns[key], knowns);

        if (substitutedKnowns[key].includes('°')) {
          substitutedKnowns[key] = this.toRadians(substitutedKnowns[key]);
        }
      }
    }

    return substitutedKnowns;
  }

  private substituteEquation(
    equation: string,
    knowns: { [key: string]: string },
    roundValues = false,
    replaceDegrees = true
  ) {
    return equation.replace(/([a-zA-Zθ_]+)/g, (match) => {
      const value = knowns[match];

      if (value != null) {
        if (replaceDegrees && value.includes('°')) {
          return this.toRadians(value);
        }

        if (roundValues) {
          return parseFloat(value).toFixed(2);
        } else {
          return value.toString();
        }
      } else {
        return match;
      }
    });
  }

  private toRadians(value: string) {
    // Check if the value is in degrees (e.g., '60°'),
    // then use nerdamer(radians(60)).toDecimal() to convert it to radians
    const degrees = parseFloat(value.replace('°', ''));
    return nerdamer(`radians(${degrees})`).evaluate().toDecimal().toString();
  }

  public solveEquation(
    equation: string,
    knowns: { [key: string]: string },
    targetVar: string
  ): SolvedResult | null {
    try {
      let result: SolvedResult = {
        subsitutedEquation: '',
        evaluatedEquation: '',
        finalAnswer: '',
      };

      // console.log('Original Equation:', equation);

      // const substitutedEquation = this.substituteEquation(equation, knowns);
      // console.log('Substituted Equation:', substitutedEquation);

      result.subsitutedEquation = this.substituteEquation(
        equation,
        knowns,
        true,
        false
      );
      // console.log('Substituted Equation:', result.subsitutedEquation);

      // Set the known variables in nerdamer.
      nerdamer.clearVars();
      for (const key in knowns) {
        if (knowns.hasOwnProperty(key)) {
          nerdamer.setVar(key, knowns[key]);
        }
      }

      const evaluated = nerdamer(equation).evaluate();
      // console.log('Evaluated:', evaluated.toString());

      const solved = evaluated.solveFor(targetVar);
      // console.log('Solved:', solved.toString());

      // Check if the solution has multiple values
      if (Array.isArray(solved)) {
        const results = solved.map((solution) => {
          const result: string = nerdamer(solution)
            .evaluate()
            .toDecimal()
            .toString();

          // console.log('Result in array', result);

          return result;
        });

        // If the variable starts with 't' or 'T', filter out negative time solutions
        if (targetVar.startsWith('t') || targetVar.startsWith('T')) {
          const positiveResults = results.filter(
            (result) => parseFloat(result) >= 0
          );

          if (positiveResults.length === 1) {
            knowns[targetVar] = positiveResults[0];
            result.finalAnswer = positiveResults[0];
          } else if (positiveResults.length > 1) {
            knowns[targetVar] = positiveResults.join(', ');
            result.finalAnswer = positiveResults.join(', ');
          } else {
            knowns[targetVar] = results.join(', ');
            result.finalAnswer = results.join(', ');
          }
        } else {
          // For non-time variables, return all solutions
          knowns[targetVar] = results.join(', ');
          result.finalAnswer = results.join(', ');
        }

        return result;
      } else {
        result.finalAnswer = nerdamer(solved).toDecimal().toString();

        if (solved) {
          knowns[targetVar] = result.finalAnswer;
          return result;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error evaluating equation: ${equation}`, error);

      return null;
    }
  }
}
