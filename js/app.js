var whitesPerspective = true;
var showCoordinates = true;
var allowHighlights = true;
var rowAndColumnMode = false;
var trainingInProgress = false;
var showPieces = true;
var targetCoordinate = null;
var goNext = false;
var correctSquare = null;
var incorrectSquare = null;
var guessResults = [];

const rowNames = ['1', '2', '3', '4', '5', '6', '7', '8'];
const colNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// configuration for behavior during training
var defaultConfig = {
    coordinates: false,
    highlights: false,
    perspectives: 'both', // white/black/both
    pieces: true
};

var config = defaultConfig;

var pieces = {
    white: {
        king: 'Chess_klt45.svg',
        queen: 'Chess_qlt45.svg',
        rook: 'Chess_rlt45.svg',
        knight: 'Chess_nlt45.svg',
        bishop: 'Chess_blt45.svg',
        pawn: 'Chess_plt45.svg'
    },
    black: {
        king: 'Chess_kdt45.svg',
        queen: 'Chess_qdt45.svg',
        rook: 'Chess_rdt45.svg',
        knight: 'Chess_ndt45.svg',
        bishop: 'Chess_bdt45.svg',
        pawn: 'Chess_pdt45.svg'
    }
};

function flipBoard() {
    whitesPerspective = !whitesPerspective;

    const board = document.getElementById("board");

    if (whitesPerspective) {
        board.classList.remove("flipped-perspective");
    } else {
        board.classList.add("flipped-perspective");
    }

    generateCoordinates();
    

    const chessPieces = document.getElementsByClassName('chess-piece');
    for (let i = 0; i < chessPieces.length; ++i) {
        const piece = chessPieces[i];
        if (whitesPerspective) {
            piece.classList.remove('flipped-perspective');
        }
        else {
            piece.classList.add('flipped-perspective');
        }
    };
}

function setCoordinateColor(span, cell) {
    const backgroundColor = getComputedStyle(cell).getPropertyValue('background-color');
    const textColor = backgroundColor === 'rgb(181, 136, 99)' ? '#F0D9B5' : '#B58863'; // Opposite color of background
    span.style.color = textColor;
}

function setCoordinateDisplay(enabled) {
    showCoordinates = enabled;

    if (showCoordinates) {
        generateCoordinates();
    }
    else {
        clearCoordinates();
    }
}

function toggleCoordinatesDisplay() {
    setCoordinateDisplay(!showCoordinates);
}

function clearCoordinates() {
    const coordinates = document.querySelectorAll('.coordinate');
    coordinates.forEach((coordinate) => {
        coordinate.remove();
    });
}

function generateCoordinates() {
    clearCoordinates();
    
    if (showCoordinates) {
        const columnLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const firstColumn = document.querySelectorAll(whitesPerspective ? 'tr td:first-child' : 'tr td:last-child');
        firstColumn.forEach(function(cell, index) {
            const span = document.createElement('span');
            span.classList.add('label');
            span.classList.add('coordinate', whitesPerspective ? 'column-label' : 'column-label-flipped', !whitesPerspective ? 'flipped-perspective' : 'na');
            span.textContent = columnLabels[index];
            setCoordinateColor(span, cell);
            cell.appendChild(span);
        });
        
        const rowLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const lastRow = document.querySelectorAll(whitesPerspective ? 'tr:last-child td' : 'tr:first-child td');
        lastRow.forEach(function (cell, index) {
            const span = document.createElement('span');
            span.classList.add('label');
            span.classList.add('coordinate', whitesPerspective ? 'row-label' : 'row-label-flipped', !whitesPerspective ? 'flipped-perspective' : 'na');
            span.textContent = rowLabels[index];
            setCoordinateColor(span, cell);
            cell.appendChild(span);
        });
    }
}

function clearPieces() {
    // Get all squares on the chessboard
    const squares = document.querySelectorAll('td');

    // Loop through each square
    for (let i = 0; i < squares.length; ++i) {
        const square = squares[i];
        // Get all child elements (chess piece images) within the square
        const chessPieces = square.querySelectorAll('img');
        if (chessPieces.length) {
            chessPieces[0].remove();
        }
    };
}

function generatePieces() {
    clearPieces();

    if (!showPieces) {
        return;
    }

    for (let row = 1; row <= 8; ++row) {
        if (row > 2 && row < 7) {
            // ignore all 4 middle rows
            continue;
        }

        const squareColor = row >= 5 ? 'black' : 'white';

        for (let col = 1; col <= 8; ++col) {
            let pieceType = 'pawn';
            if (row === 1 || row === 8) {
                const piecesOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
                pieceType = piecesOrder[col - 1];
            }
            
            const pieceImg = document.createElement('img');
            pieceImg.src = `img/pieces/${pieces[squareColor][pieceType]}`;
            pieceImg.alt = `${squareColor} ${pieceType}`;
            pieceImg.classList.add('chess-piece');

            const squareId = `${colNames[col - 1]}${row}`;
            const square = document.getElementsByName(squareId)[0];
            square.appendChild(pieceImg);
        }
    }
}

function setTrainingInProgress(isTrainingInProgress) {
    trainingInProgress = isTrainingInProgress;

    const board = document.getElementById('board'),
          coordDisplay = document.getElementById('coordinate-to-guess'),
          start = document.getElementById('start'),
          configDisplay = document.getElementById('config'),
          squares = Array.from(document.getElementsByTagName('td'));

    if (trainingInProgress) {
        board.classList.remove('hidden');
        coordDisplay.classList.remove('hidden');
        start.classList.add('hidden');
        configDisplay.classList.add('hidden');
        squares.forEach((td) => {
            td.classList.add('pointer');
        });
        showCoordinates = config.coordinates;
        allowHighlights = config.highlights;
    }
    else {
        board.classList.add('hidden');
        coordDisplay.classList.add('hidden');
        start.classList.remove('hidden');
        configDisplay.classList.remove('hidden');
        squares.forEach((td) => {
            td.classList.remove('pointer');
        });
        showCoordinates = true;
        allowHighlights = false;
    }

    generateCoordinates();
    onResize();

    startTraining();
}

function startTraining() {
    if (rowAndColumnMode) {
        getNextRowOrColumn();
    }
    else {
        getNextCoordinate();
    }
}

function getNextCoordinate() {
    let nextCoord;
    do {
        nextCoord = getRandomCoordinate();
    }
    while (nextCoord === targetCoordinate);

    const guessDisplay = document.getElementById('coord'),
          feedback = document.getElementById('feedback'),
          board = document.getElementById('board');
    
    guessDisplay.textContent = nextCoord;
    feedback.textContent = "\u00A0";

    board.classList.remove('correct-border');
    board.classList.remove('incorrect-border');

    if (correctSquare) {
        correctSquare.classList.remove('correct-square');
        correctSquare = null;
    }

    if (incorrectSquare) {
        incorrectSquare.classList.remove('incorrect-square');
        incorrectSquare = null;
    }

    targetCoordinate = nextCoord;

    if (config.perspectives === 'both') {
        var perspective = Math.random() >= 0.5;
        if (perspective !== whitesPerspective) {
            flipBoard();
        }
    }

    goNext = false;
}

function getNextRowOrColumn() {
    let data;
    do {
        data = getRandomColumnOrRow();
    }
    while (targetCoordinate && data.row === targetCoordinate.row && data.coord === targetCoordinate.coord);

    const guessDisplay = document.getElementById('coord'),
          feedback = document.getElementById('feedback'),
          board = document.getElementById('board'),
          nextCoord = data.coord;

    guessDisplay.textContent = `${nextCoord}  ${data.row ? 'rank' : 'file'}`;
    feedback.textContent = "\u00A0";

    board.classList.remove('correct-border');
    board.classList.remove('incorrect-border');

    if (correctSquare) {
        correctSquare.forEach((square) => {
            square.classList.remove('correct-square');
        });
        correctSquare = null;
    }

    if (incorrectSquare) {
        incorrectSquare.forEach((square) => {
            square.classList.remove('incorrect-square');
        });
        incorrectSquare = null;
    }

    targetCoordinate = data;

    if (config.perspectives === 'both') {
        var perspective = Math.random() >= 0.5;
        if (perspective !== whitesPerspective) {
            flipBoard();
        }
    }

    goNext = false;
}

function guess(coordGuess) {
    const feedback = document.getElementById('feedback'),
          board = document.getElementById('board');

    guessResults.push({
        correct: coordGuess === targetCoordinate,
        perspective: whitesPerspective ? 'white' : 'black',
        target: targetCoordinate,
        mode: 'coordinate',
        guess: coordGuess
    });

    if (coordGuess === targetCoordinate) {
        // correct
        feedback.classList.add('correct');
        feedback.classList.remove('incorrect');
        feedback.textContent = "CORRECT!";

        board.classList.add('correct-border');
    }
    else {
        // incorrect
        feedback.classList.remove('correct');
        feedback.classList.add('incorrect');
        feedback.textContent = "INCORRECT!";

        incorrectSquare = document.getElementsByName(coordGuess)[0];
        incorrectSquare.classList.add('incorrect-square');
        incorrectSquare.classList.remove('highlight');

        board.classList.add('incorrect-border');
    }

    correctSquare = document.getElementsByName(targetCoordinate)[0];
    correctSquare.classList.add('correct-square');
    correctSquare.classList.remove('highlight');

    goNext = true;
}

function guessRowOrColumn(lineGuess) {
    const feedback = document.getElementById('feedback'),
          board = document.getElementById('board');
    
    const guessIndex = targetCoordinate.row ? lineGuess[1] : lineGuess[0];
    const correctIndex = targetCoordinate.coord;
    const isCorrect = correctIndex === guessIndex;
    
    guessResults.push({
        correct: isCorrect,
        perspective: whitesPerspective ? 'white' : 'black',
        target: targetCoordinate,
        mode: 'row-or-column',
        guess: lineGuess
    });

    if (isCorrect) {
        feedback.classList.add('correct');
        feedback.classList.remove('incorrect');
        feedback.textContent = 'CORRECT!';

        board.classList.add('correct-border');
    }
    else {
        feedback.classList.remove('correct');
        feedback.classList.add('incorrect');
        feedback.textContent = "INCORRECT!";

        incorrectSquare = [];
        for (let i = 0; i < rowNames.length; ++i) {
            let cell;
            if (targetCoordinate.row) {
                cell = document.getElementsByName(colNames[i] + guessIndex)[0];
                cell.classList.add('incorrect-square');
                cell.classList.remove('highlight');
            }
            else {
                cell = document.getElementsByName(guessIndex + rowNames[i])[0];
                cell.classList.add('incorrect-square');
                cell.classList.remove('highlight');
            }

            incorrectSquare.push(cell);
        }

        board.classList.add('incorrect-border');
    }
    
    correctSquare = [];
    for (let j = 0; j < rowNames.length; ++j) {
        let cell;
            if (targetCoordinate.row) {
                cell = document.getElementsByName(colNames[j] + correctIndex)[0];
                cell.classList.add('correct-square');
                cell.classList.remove('highlight');
            }
            else {
                cell = document.getElementsByName(correctIndex + rowNames[j])[0];
                cell.classList.add('correct-square');
                cell.classList.remove('highlight');
            }

            correctSquare.push(cell);
    }

    goNext = true;
}

function onResize() {
    const borderHeight = 20;
    let contentHeight = document.getElementById('content').offsetHeight - document.getElementById('coordinate-to-guess').offsetHeight - document.getElementById('config').offsetHeight - document.getElementById('start').offsetHeight - borderHeight;
    let contentWidth = contentHeight;
    document.documentElement.style.setProperty('--content-height', `${contentHeight}px`);
    document.documentElement.style.setProperty('--content-width', `${contentWidth}px`);
}

function getRandomCoordinate() {
    const randomIndex = Math.floor(Math.random() * rowNames.length);
    const file = colNames[randomIndex];
    const row = Math.floor(Math.random() * 8) + 1; // Random between 1 and 8 (inclusive)
    return `${file}${row}`;
}

function getRandomColumnOrRow() {
    const isRow = Math.random() >= 0.5;
    const coordinate = getRandomCoordinate();
    return {
        row: isRow,
        col: !isRow,
        coord: isRow ? coordinate[1] : coordinate[0]
    };
}

function createEventHandlers() {
    window.addEventListener('resize', onResize);

    const tds = document.querySelectorAll('td');

    // Loop through each td element
    tds.forEach(td => {
        // Add mouseover event listener
        td.addEventListener('mouseover', function() {
            // Add a CSS class to highlight on hover
            if (allowHighlights && trainingInProgress) {
                if (!this.classList.contains('correct-square') && !this.classList.contains('incorrect-square')) {
                    this.classList.add('highlight');
                }
            }
        });

        // Add mouseout event listener
        td.addEventListener('mouseout', function() {
            // Remove the CSS class when mouse moves out
            this.classList.remove('highlight');
        });

        td.addEventListener('click', function() {
            if (trainingInProgress && targetCoordinate != null) {
                if (!goNext) {
                    if (rowAndColumnMode) {
                        guessRowOrColumn(this.getAttribute('name'));
                    }
                    else {
                        guess(this.getAttribute('name'));
                    }
                }
                else {
                    if (rowAndColumnMode) {
                        getNextRowOrColumn();
                    }
                    else {
                        getNextCoordinate();
                    }
                }
            }
        });
    });

    document.getElementById('start-button').addEventListener('click', function() {
        rowAndColumnMode = false;

        setTrainingInProgress(true);
    });

    document.getElementById('start-row-col-button').addEventListener('click', function() {
        rowAndColumnMode = true;

        setTrainingInProgress(true);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    onResize();
    generateCoordinates();
    createEventHandlers();
    generatePieces();
});
