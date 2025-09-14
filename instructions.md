create a landing page on /landing: define the game and add a CTA that "Let's play!" then redirect it on: current flow.

- ON Setup new game, instead of showing all locations in a dropdown make ux more simpler, by adding one simple button based selection on the location, remove default date showing, just add those in a list.
- instead of making it as component based, make it page router based so that on reload everything doesn't get flush away, instead everything remains saved.
- on every page just show left arrow icon not the "back" text.
- make confirm partnership page more better intuitive which feels good and better, right now it looks a bit ugly and on custom partner count check validation such that number of partners total do not exceed more than half of total players. and make this custom partner button, ghost variant.
- make this new match button much more bigger centered circular on bottom add rest three buttons ghost like, small justify between
- there is a bug, on select bidder when I select a bidder, then go to next screen to select partner, then if I go back and come to partner selection again then partner is already selected, which should not be the case, also not able to change selected partner.
- on enter bid: bid amount will be a multiple of 5 only, if I enter 134 round off it to 135 and like that implement correct round off mechanism, and max bid amount can only be 250, here display some default bid amounts by default below continue to Result button in 4 column based layout, for 4 players show: (130,135,140,145,..., upto 180), for 5 players display multiple buttons: (140, 145,150,155,160,165,170,.., upto 190), for 6 players display multiple buttons: (150,155,160,165,170,.., upto 220), for 7+ players display multiple buttons: (160,165, 170,.., upto 220 then 250)
- on partner selection screen: remove continue to bid entry instead, just after selecting required number of partners move to next screen, 
- fix bug: on 250 Card Game page:
    4 players . 0 Matched played
        here this 0 matched played is not updating after playing multiple games also, check and fix this.
- implement modify players page now, where I can add or remove players into the game.
- In Current Standings, on click of "Show History" button show a table down below showing all the results or entries in a tabular format
- On end game page: show game statistics on top of the page, and make it look more better, it is not consitent with the styling for now.
- End game and finalize results shows confetti in a very weird manner which should not be the case! implement `npm i react-confetti` instead
- Export results should download a pdf of the game in a padf format, with all the played games in a tabular format and having all the game statistics and game details on top in this page, right now only stats shows, I want all the matches data in to too in tabular format!
- And at every place show the least scorer too!