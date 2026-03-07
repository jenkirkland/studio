export interface Activity {
  id: string;
  name: string;
  description: string;
  type: 'nature' | 'food' | 'historical' | 'art' | 'entertainment' | 'shopping';
  durationMinutes: number;
  address: string;
  googleMapsUrl?: string;
}

export const ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Strongwater Farm',
    description: 'A serene therapeutic equestrian center offering a peaceful atmosphere and beautiful farm views.',
    type: 'nature',
    durationMinutes: 60,
    address: '434 Main St, Tewksbury, MA 01876',
  },
  {
    id: '2',
    name: 'Tewksbury Pie Company',
    description: 'A local favorite known for handcrafted artisanal pies and seasonal treats.',
    type: 'food',
    durationMinutes: 30,
    address: '1921 Main St, Tewksbury, MA 01876',
  },
  {
    id: '3',
    name: 'Mill No. 5',
    description: 'A hidden indoor streetscape featuring an independent cinema, curated shops, and local coffee.',
    type: 'shopping',
    durationMinutes: 120,
    address: '250 Jackson St, Lowell, MA 01852',
  },
  {
    id: '4',
    name: 'Stevens-Coolidge House & Gardens',
    description: 'Explore the elegant "farm-and-garden" estate with its stunning formal gardens and sweeping lawns.',
    type: 'nature',
    durationMinutes: 90,
    address: '153 Chickering Rd, North Andover, MA 01845',
  },
  {
    id: '5',
    name: 'Western Avenue Studios',
    description: 'The largest community of artists in the country with open studios and amazing local art.',
    type: 'art',
    durationMinutes: 150,
    address: '122 Western Ave, Lowell, MA 01851',
  },
  {
    id: '6',
    name: 'Parlee Farms',
    description: 'Famous for fruit picking, farm animals, and the best cider donuts in the region.',
    type: 'food',
    durationMinutes: 90,
    address: '95 Farwell Rd, Tyngsborough, MA 01879',
  },
  {
    id: '7',
    name: 'The Worthen House',
    description: 'Lowell\'s oldest tavern featuring historical charm, a unique belt-driven fan system, and great food.',
    type: 'historical',
    durationMinutes: 90,
    address: '141 Worthen St, Lowell, MA 01852',
  },
  {
    id: '8',
    name: 'Long Meadow Golf Club',
    description: 'A historic and beautifully maintained local golf course for a relaxing afternoon.',
    type: 'entertainment',
    durationMinutes: 180,
    address: '165 Lowell Rd, Lowell, MA 01852',
  },
  {
    id: '9',
    name: 'Andover Village Square',
    description: 'A charming walkable area with upscale boutiques, galleries, and fine dining.',
    type: 'shopping',
    durationMinutes: 120,
    address: 'Main St, Andover, MA 01810',
  },
  {
    id: '10',
    name: 'Public Health Museum',
    description: 'A unique museum located on the grounds of the Tewksbury Hospital exploring health history.',
    type: 'historical',
    durationMinutes: 60,
    address: '365 East St, Tewksbury, MA 01876',
  }
];
