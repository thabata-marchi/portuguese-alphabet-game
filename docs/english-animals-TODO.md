# TODO: English animals (in development)

Animals levels are currently **hidden**. Only **colors** are active in the English game.

## To re-enable animals when ready

### 1. Add levels to `src/data/english-content.json`

Add back under `"levels"` the keys `animals_basic` and `animals_extended` with this structure:

```json
"animals_basic": {
  "title": "Animals",
  "description": "Find the animal!",
  "optionType": "text",
  "items": ["dog", "cat", "bird", "fish", "lion", "cow", "pig", "duck"],
  "prompts": {
    "dog": "Find the dog!",
    "cat": "Find the cat!",
    ...
  }
},
"animals_extended": {
  "title": "More animals",
  "optionType": "text",
  "items": ["dog", "cat", "bird", "fish", "lion", "cow", "pig", "duck", "horse", "mouse", "frog", "bear"],
  "prompts": { ... }
}
```

### 2. Add level entries to `src/data/english-levels.json`

Append to the array:

```json
{
  "id": 3,
  "title": "Animals",
  "contentKey": "animals_basic",
  "waves": 6,
  "optionsCount": 4,
  "speed": 4,
  "time": 14,
  "pointsPerCorrect": 15
},
{
  "id": 4,
  "title": "More animals",
  "contentKey": "animals_extended",
  "waves": 8,
  "optionsCount": 4,
  "speed": 4,
  "time": 12,
  "pointsPerCorrect": 20
}
```

### 3. Remove TODOs from code

- `src/modules/EnglishQuestionManager.js` – remove the TODO comment at the top.
- `src/modules/Game.js` – remove the TODO comment above the english-levels import.
