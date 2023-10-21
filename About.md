The support code provided the basic environment for the visualization. I used colorbrewer2 to get color blind safe colors. Gun Deaths per 100K population is calculated, added in the tool tip and the states are given colors according to the scaled value. It is a resonable metric to categorize the states in range of safe to risky as it evaluated per population. That is also the same reason why it is used to color the states.

The bottom half shows a stacked bar chart where the total bar equals the total gun deaths in the state in 2014. the bar is divided into 2 halves by the ratio of male to female deaths and the respective colors are shown in the legend. The code is modifies to use area insted of radius for the cities. Also, the opacity and minimum radius of the cities is increased to show the presence of the cities with low gun activities. If the minimum value is not maintained the cities will vanish which neglects those values. To overcome this issue, minimum value is maintained.

Sources:

Choropleth Map : https://observablehq.com/@d3/us-state-choropleth/2

Stacked Bar Chart : https://observablehq.com/@thetylerwolf/day-9-stacked-bar-chart

State map: https://eric.clst.org/tech/usgeojson/
Original state population: US Census 
https://www.census.gov/data/tables/time-series/demo/popest/2010s-state-total.html
Original Slate gun violence dataset:
https://www.slate.com/articles/news_and_politics/crime/2012/12/gun_death_tally_every_american_gun_death_since_newtown_sandy_hook_shooting.html  
