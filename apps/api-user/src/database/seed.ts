import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  User,
  Player,
  PlayerSeasonStats,
  GameDay,
  Game,
  GamePlayerStats,
  Room,
  RoomMember,
  Lineup,
} from '@fantasy-nba/db';
import { computeFantasyScore, computePlayerCosts, SCORE_WEIGHTS_DEFAULT, CURRENT_SEASON } from '@fantasy-nba/shared';

// ---------------------------------------------------------------------------
// Mock player data: 10 teams × 10 players = 100 players
// ---------------------------------------------------------------------------
const TEAMS_DATA = [
  {
    team: 'Lakers',
    players: [
      { name: 'LeBron James', position: 'SF', jersey: '23', stats: { ppg: 25.7, rpg: 7.3, apg: 8.3, spg: 1.3, bpg: 0.6, topg: 3.5, mpg: 35.3 } },
      { name: 'Anthony Davis', position: 'C', jersey: '3', stats: { ppg: 24.7, rpg: 12.6, apg: 3.5, spg: 1.2, bpg: 2.4, topg: 2.1, mpg: 35.5 } },
      { name: 'Austin Reaves', position: 'SG', jersey: '15', stats: { ppg: 15.9, rpg: 4.5, apg: 5.5, spg: 0.9, bpg: 0.2, topg: 1.8, mpg: 33.0 } },
      { name: 'Rui Hachimura', position: 'PF', jersey: '28', stats: { ppg: 13.8, rpg: 4.4, apg: 1.3, spg: 0.7, bpg: 0.4, topg: 0.9, mpg: 27.1 } },
      { name: 'D\'Angelo Russell', position: 'PG', jersey: '1', stats: { ppg: 18.0, rpg: 3.1, apg: 6.3, spg: 1.0, bpg: 0.2, topg: 2.8, mpg: 29.5 } },
      { name: 'Taurean Prince', position: 'SF', jersey: '12', stats: { ppg: 9.2, rpg: 3.4, apg: 1.2, spg: 0.5, bpg: 0.3, topg: 0.8, mpg: 22.4 } },
      { name: 'Gabe Vincent', position: 'PG', jersey: '7', stats: { ppg: 7.6, rpg: 2.1, apg: 3.2, spg: 0.7, bpg: 0.1, topg: 1.2, mpg: 21.8 } },
      { name: 'Jaxson Hayes', position: 'C', jersey: '11', stats: { ppg: 8.4, rpg: 5.2, apg: 0.8, spg: 0.4, bpg: 1.3, topg: 1.0, mpg: 20.3 } },
      { name: 'Max Christie', position: 'SG', jersey: '10', stats: { ppg: 6.9, rpg: 2.6, apg: 1.0, spg: 0.5, bpg: 0.2, topg: 0.7, mpg: 19.2 } },
      { name: 'Wenyen Gabriel', position: 'PF', jersey: '35', stats: { ppg: 4.1, rpg: 3.8, apg: 0.5, spg: 0.4, bpg: 0.5, topg: 0.5, mpg: 14.6 } },
    ],
  },
  {
    team: 'Celtics',
    players: [
      { name: 'Jayson Tatum', position: 'SF', jersey: '0', stats: { ppg: 26.9, rpg: 8.1, apg: 4.9, spg: 1.1, bpg: 0.6, topg: 2.9, mpg: 35.8 } },
      { name: 'Jaylen Brown', position: 'SG', jersey: '7', stats: { ppg: 23.0, rpg: 5.5, apg: 3.6, spg: 1.2, bpg: 0.5, topg: 2.7, mpg: 34.2 } },
      { name: 'Kristaps Porzingis', position: 'C', jersey: '8', stats: { ppg: 20.1, rpg: 7.2, apg: 2.0, spg: 0.7, bpg: 1.9, topg: 1.8, mpg: 29.3 } },
      { name: 'Jrue Holiday', position: 'PG', jersey: '4', stats: { ppg: 12.5, rpg: 5.4, apg: 4.8, spg: 2.1, bpg: 0.5, topg: 2.0, mpg: 31.5 } },
      { name: 'Al Horford', position: 'PF', jersey: '42', stats: { ppg: 9.2, rpg: 6.8, apg: 2.7, spg: 0.9, bpg: 1.1, topg: 1.4, mpg: 26.8 } },
      { name: 'Derrick White', position: 'SG', jersey: '9', stats: { ppg: 15.2, rpg: 4.2, apg: 4.9, spg: 1.0, bpg: 1.1, topg: 1.8, mpg: 31.0 } },
      { name: 'Payton Pritchard', position: 'PG', jersey: '11', stats: { ppg: 9.8, rpg: 2.4, apg: 3.7, spg: 0.6, bpg: 0.1, topg: 1.1, mpg: 22.6 } },
      { name: 'Luke Kornet', position: 'C', jersey: '2', stats: { ppg: 5.3, rpg: 3.9, apg: 0.7, spg: 0.3, bpg: 1.8, topg: 0.5, mpg: 16.4 } },
      { name: 'Sam Hauser', position: 'SF', jersey: '30', stats: { ppg: 9.5, rpg: 3.1, apg: 1.4, spg: 0.4, bpg: 0.2, topg: 0.8, mpg: 23.7 } },
      { name: 'Xavier Tillman', position: 'PF', jersey: '26', stats: { ppg: 4.7, rpg: 4.5, apg: 1.1, spg: 0.6, bpg: 0.7, topg: 0.7, mpg: 15.3 } },
    ],
  },
  {
    team: 'Warriors',
    players: [
      { name: 'Stephen Curry', position: 'PG', jersey: '30', stats: { ppg: 26.4, rpg: 4.6, apg: 5.0, spg: 1.4, bpg: 0.2, topg: 3.3, mpg: 33.2 } },
      { name: 'Klay Thompson', position: 'SG', jersey: '11', stats: { ppg: 17.9, rpg: 3.3, apg: 2.4, spg: 0.8, bpg: 0.5, topg: 1.5, mpg: 30.1 } },
      { name: 'Draymond Green', position: 'PF', jersey: '23', stats: { ppg: 8.6, rpg: 7.2, apg: 6.0, spg: 1.2, bpg: 0.8, topg: 3.5, mpg: 28.8 } },
      { name: 'Andrew Wiggins', position: 'SF', jersey: '22', stats: { ppg: 13.2, rpg: 4.2, apg: 1.7, spg: 1.0, bpg: 0.7, topg: 1.1, mpg: 28.4 } },
      { name: 'Kevon Looney', position: 'C', jersey: '5', stats: { ppg: 5.9, rpg: 7.7, apg: 2.9, spg: 0.5, bpg: 0.6, topg: 1.4, mpg: 23.8 } },
      { name: 'Chris Paul', position: 'PG', jersey: '3', stats: { ppg: 9.2, rpg: 3.9, apg: 6.8, spg: 1.5, bpg: 0.2, topg: 1.8, mpg: 27.1 } },
      { name: 'Jonathan Kuminga', position: 'SF', jersey: '00', stats: { ppg: 16.1, rpg: 4.8, apg: 2.1, spg: 0.9, bpg: 0.5, topg: 1.7, mpg: 26.3 } },
      { name: 'Moses Moody', position: 'SG', jersey: '4', stats: { ppg: 8.3, rpg: 2.8, apg: 1.4, spg: 0.7, bpg: 0.3, topg: 0.8, mpg: 20.5 } },
      { name: 'Gary Payton II', position: 'PG', jersey: '8', stats: { ppg: 7.1, rpg: 3.9, apg: 2.1, spg: 1.4, bpg: 0.5, topg: 0.9, mpg: 23.2 } },
      { name: 'Trayce Jackson-Davis', position: 'C', jersey: '32', stats: { ppg: 8.0, rpg: 6.3, apg: 1.8, spg: 0.5, bpg: 1.2, topg: 1.2, mpg: 20.1 } },
    ],
  },
  {
    team: 'Bucks',
    players: [
      { name: 'Giannis Antetokounmpo', position: 'PF', jersey: '34', stats: { ppg: 30.4, rpg: 11.5, apg: 6.5, spg: 1.2, bpg: 1.1, topg: 3.4, mpg: 35.2 } },
      { name: 'Damian Lillard', position: 'PG', jersey: '0', stats: { ppg: 24.3, rpg: 4.4, apg: 7.3, spg: 0.9, bpg: 0.3, topg: 3.1, mpg: 34.5 } },
      { name: 'Khris Middleton', position: 'SF', jersey: '22', stats: { ppg: 15.1, rpg: 4.7, apg: 4.3, spg: 0.9, bpg: 0.3, topg: 2.0, mpg: 27.9 } },
      { name: 'Brook Lopez', position: 'C', jersey: '11', stats: { ppg: 12.3, rpg: 4.6, apg: 1.4, spg: 0.5, bpg: 2.6, topg: 1.1, mpg: 26.8 } },
      { name: 'Bobby Portis', position: 'PF', jersey: '9', stats: { ppg: 14.8, rpg: 9.4, apg: 1.1, spg: 0.7, bpg: 0.7, topg: 1.4, mpg: 28.3 } },
      { name: 'Pat Connaughton', position: 'SG', jersey: '24', stats: { ppg: 8.9, rpg: 4.5, apg: 1.6, spg: 0.5, bpg: 0.4, topg: 1.0, mpg: 22.5 } },
      { name: 'Malik Beasley', position: 'SG', jersey: '5', stats: { ppg: 11.2, rpg: 2.8, apg: 1.4, spg: 0.7, bpg: 0.2, topg: 1.0, mpg: 24.7 } },
      { name: 'MarJon Beauchamp', position: 'SF', jersey: '0', stats: { ppg: 5.8, rpg: 3.2, apg: 0.8, spg: 0.6, bpg: 0.4, topg: 0.6, mpg: 17.1 } },
      { name: 'Taurean Prince', position: 'PF', jersey: '12', stats: { ppg: 7.6, rpg: 3.5, apg: 1.3, spg: 0.6, bpg: 0.3, topg: 0.7, mpg: 19.8 } },
      { name: 'Robin Lopez', position: 'C', jersey: '42', stats: { ppg: 4.2, rpg: 3.8, apg: 0.4, spg: 0.2, bpg: 0.9, topg: 0.5, mpg: 13.2 } },
    ],
  },
  {
    team: 'Nuggets',
    players: [
      { name: 'Nikola Jokic', position: 'C', jersey: '15', stats: { ppg: 26.4, rpg: 12.4, apg: 9.0, spg: 1.4, bpg: 0.9, topg: 3.0, mpg: 34.6 } },
      { name: 'Jamal Murray', position: 'PG', jersey: '27', stats: { ppg: 21.2, rpg: 4.1, apg: 6.5, spg: 1.2, bpg: 0.3, topg: 2.7, mpg: 33.8 } },
      { name: 'Michael Porter Jr.', position: 'SF', jersey: '1', stats: { ppg: 16.8, rpg: 6.8, apg: 1.4, spg: 0.8, bpg: 0.6, topg: 1.3, mpg: 30.2 } },
      { name: 'Aaron Gordon', position: 'PF', jersey: '50', stats: { ppg: 13.9, rpg: 6.7, apg: 3.5, spg: 1.0, bpg: 0.7, topg: 1.8, mpg: 30.9 } },
      { name: 'Kentavious Caldwell-Pope', position: 'SG', jersey: '5', stats: { ppg: 13.5, rpg: 3.0, apg: 2.2, spg: 1.1, bpg: 0.3, topg: 1.1, mpg: 30.8 } },
      { name: 'Reggie Jackson', position: 'PG', jersey: '7', stats: { ppg: 9.7, rpg: 2.8, apg: 4.0, spg: 0.7, bpg: 0.2, topg: 1.5, mpg: 23.4 } },
      { name: 'Peyton Watson', position: 'SF', jersey: '8', stats: { ppg: 7.2, rpg: 3.6, apg: 1.0, spg: 0.8, bpg: 0.9, topg: 0.8, mpg: 20.8 } },
      { name: 'DeAndre Jordan', position: 'C', jersey: '6', stats: { ppg: 3.8, rpg: 5.4, apg: 0.5, spg: 0.2, bpg: 1.0, topg: 0.6, mpg: 14.7 } },
      { name: 'Julian Strawther', position: 'SG', jersey: '3', stats: { ppg: 6.5, rpg: 2.4, apg: 1.1, spg: 0.5, bpg: 0.2, topg: 0.7, mpg: 17.3 } },
      { name: 'Zeke Nnaji', position: 'PF', jersey: '22', stats: { ppg: 5.0, rpg: 4.2, apg: 0.6, spg: 0.3, bpg: 0.5, topg: 0.6, mpg: 16.1 } },
    ],
  },
  {
    team: 'Heat',
    players: [
      { name: 'Jimmy Butler', position: 'SF', jersey: '22', stats: { ppg: 20.8, rpg: 5.3, apg: 5.0, spg: 1.4, bpg: 0.4, topg: 2.3, mpg: 33.9 } },
      { name: 'Bam Adebayo', position: 'C', jersey: '13', stats: { ppg: 19.3, rpg: 10.4, apg: 3.3, spg: 1.1, bpg: 0.9, topg: 2.6, mpg: 34.4 } },
      { name: 'Tyler Herro', position: 'SG', jersey: '14', stats: { ppg: 20.8, rpg: 5.1, apg: 4.5, spg: 0.8, bpg: 0.3, topg: 2.8, mpg: 32.7 } },
      { name: 'Kyle Lowry', position: 'PG', jersey: '7', stats: { ppg: 6.1, rpg: 4.3, apg: 5.9, spg: 1.2, bpg: 0.2, topg: 1.7, mpg: 24.8 } },
      { name: 'Kevin Love', position: 'PF', jersey: '42', stats: { ppg: 7.3, rpg: 7.8, apg: 2.1, spg: 0.5, bpg: 0.5, topg: 1.5, mpg: 20.4 } },
      { name: 'Duncan Robinson', position: 'SG', jersey: '55', stats: { ppg: 13.7, rpg: 3.1, apg: 2.8, spg: 0.5, bpg: 0.2, topg: 1.3, mpg: 28.2 } },
      { name: 'Haywood Highsmith', position: 'SF', jersey: '24', stats: { ppg: 8.1, rpg: 3.5, apg: 0.9, spg: 0.7, bpg: 0.5, topg: 0.7, mpg: 21.6 } },
      { name: 'Josh Richardson', position: 'PG', jersey: '0', stats: { ppg: 7.2, rpg: 3.0, apg: 2.6, spg: 0.9, bpg: 0.3, topg: 1.0, mpg: 22.0 } },
      { name: 'Thomas Bryant', position: 'C', jersey: '31', stats: { ppg: 8.6, rpg: 6.5, apg: 0.8, spg: 0.3, bpg: 1.1, topg: 1.1, mpg: 19.7 } },
      { name: 'Caleb Martin', position: 'PF', jersey: '16', stats: { ppg: 9.2, rpg: 4.9, apg: 1.9, spg: 1.0, bpg: 0.5, topg: 1.1, mpg: 25.1 } },
    ],
  },
  {
    team: 'Clippers',
    players: [
      { name: 'Kawhi Leonard', position: 'SF', jersey: '2', stats: { ppg: 23.7, rpg: 6.1, apg: 3.6, spg: 1.6, bpg: 0.5, topg: 2.4, mpg: 32.0 } },
      { name: 'Paul George', position: 'SG', jersey: '13', stats: { ppg: 22.6, rpg: 5.2, apg: 3.5, spg: 1.5, bpg: 0.4, topg: 2.7, mpg: 31.8 } },
      { name: 'James Harden', position: 'PG', jersey: '1', stats: { ppg: 16.6, rpg: 5.2, apg: 8.5, spg: 1.2, bpg: 0.5, topg: 3.7, mpg: 33.0 } },
      { name: 'Ivica Zubac', position: 'C', jersey: '40', stats: { ppg: 11.4, rpg: 9.2, apg: 1.6, spg: 0.5, bpg: 1.1, topg: 1.4, mpg: 25.7 } },
      { name: 'P.J. Tucker', position: 'PF', jersey: '17', stats: { ppg: 4.9, rpg: 3.7, apg: 1.2, spg: 0.7, bpg: 0.3, topg: 0.7, mpg: 18.8 } },
      { name: 'Russell Westbrook', position: 'PG', jersey: '0', stats: { ppg: 11.1, rpg: 4.9, apg: 4.7, spg: 1.2, bpg: 0.3, topg: 3.1, mpg: 26.4 } },
      { name: 'Bones Hyland', position: 'SG', jersey: '5', stats: { ppg: 10.5, rpg: 2.5, apg: 3.4, spg: 0.8, bpg: 0.2, topg: 1.4, mpg: 24.3 } },
      { name: 'Mason Plumlee', position: 'C', jersey: '44', stats: { ppg: 5.7, rpg: 5.8, apg: 2.0, spg: 0.4, bpg: 0.7, topg: 1.4, mpg: 17.5 } },
      { name: 'Terance Mann', position: 'SF', jersey: '14', stats: { ppg: 8.3, rpg: 3.6, apg: 2.0, spg: 0.8, bpg: 0.3, topg: 1.0, mpg: 22.1 } },
      { name: 'Norman Powell', position: 'SG', jersey: '24', stats: { ppg: 13.8, rpg: 2.5, apg: 1.8, spg: 0.8, bpg: 0.3, topg: 1.1, mpg: 25.4 } },
    ],
  },
  {
    team: 'Suns',
    players: [
      { name: 'Kevin Durant', position: 'SF', jersey: '35', stats: { ppg: 27.1, rpg: 6.6, apg: 5.0, spg: 0.8, bpg: 1.2, topg: 3.2, mpg: 36.7 } },
      { name: 'Bradley Beal', position: 'SG', jersey: '3', stats: { ppg: 18.2, rpg: 4.4, apg: 5.0, spg: 1.0, bpg: 0.3, topg: 2.9, mpg: 31.4 } },
      { name: 'Devin Booker', position: 'SG', jersey: '1', stats: { ppg: 27.8, rpg: 4.5, apg: 6.9, spg: 1.1, bpg: 0.4, topg: 3.7, mpg: 35.1 } },
      { name: 'Jusuf Nurkic', position: 'C', jersey: '20', stats: { ppg: 11.2, rpg: 9.8, apg: 2.5, spg: 0.8, bpg: 0.8, topg: 2.0, mpg: 27.6 } },
      { name: 'Grayson Allen', position: 'SG', jersey: '6', stats: { ppg: 12.4, rpg: 3.2, apg: 2.1, spg: 0.8, bpg: 0.3, topg: 1.0, mpg: 28.3 } },
      { name: 'Eric Gordon', position: 'PG', jersey: '10', stats: { ppg: 8.6, rpg: 2.1, apg: 2.8, spg: 0.7, bpg: 0.2, topg: 1.2, mpg: 22.7 } },
      { name: 'Keita Bates-Diop', position: 'PF', jersey: '32', stats: { ppg: 7.5, rpg: 4.0, apg: 1.1, spg: 0.6, bpg: 0.5, topg: 0.8, mpg: 20.3 } },
      { name: 'Bol Bol', position: 'C', jersey: '11', stats: { ppg: 5.8, rpg: 4.1, apg: 0.7, spg: 0.3, bpg: 1.6, topg: 0.7, mpg: 15.8 } },
      { name: 'Royce O\'Neale', position: 'SF', jersey: '0', stats: { ppg: 7.3, rpg: 4.1, apg: 2.6, spg: 1.0, bpg: 0.4, topg: 1.0, mpg: 25.2 } },
      { name: 'Ish Wainright', position: 'PF', jersey: '12', stats: { ppg: 3.5, rpg: 2.8, apg: 1.1, spg: 0.5, bpg: 0.3, topg: 0.4, mpg: 13.4 } },
    ],
  },
  {
    team: '76ers',
    players: [
      { name: 'Joel Embiid', position: 'C', jersey: '21', stats: { ppg: 34.7, rpg: 11.0, apg: 5.6, spg: 1.2, bpg: 1.7, topg: 3.6, mpg: 33.6 } },
      { name: 'Tyrese Maxey', position: 'PG', jersey: '0', stats: { ppg: 25.9, rpg: 3.7, apg: 6.2, spg: 1.1, bpg: 0.5, topg: 2.9, mpg: 36.2 } },
      { name: 'Kelly Oubre Jr.', position: 'SF', jersey: '12', stats: { ppg: 15.4, rpg: 5.0, apg: 1.4, spg: 1.1, bpg: 0.5, topg: 1.5, mpg: 29.5 } },
      { name: 'Tobias Harris', position: 'PF', jersey: '12', stats: { ppg: 17.2, rpg: 6.5, apg: 3.1, spg: 0.7, bpg: 0.5, topg: 1.6, mpg: 30.1 } },
      { name: 'De\'Anthony Melton', position: 'PG', jersey: '8', stats: { ppg: 8.3, rpg: 3.7, apg: 3.0, spg: 1.6, bpg: 0.4, topg: 1.1, mpg: 25.3 } },
      { name: 'Cam Payne', position: 'PG', jersey: '1', stats: { ppg: 7.2, rpg: 2.5, apg: 4.0, spg: 0.5, bpg: 0.1, topg: 1.6, mpg: 21.0 } },
      { name: 'Robert Covington', position: 'SF', jersey: '23', stats: { ppg: 6.1, rpg: 5.2, apg: 1.1, spg: 1.3, bpg: 0.9, topg: 0.8, mpg: 21.7 } },
      { name: 'Mo Bamba', position: 'C', jersey: '5', stats: { ppg: 6.5, rpg: 5.5, apg: 0.7, spg: 0.3, bpg: 1.7, topg: 0.7, mpg: 18.2 } },
      { name: 'Buddy Hield', position: 'SG', jersey: '17', stats: { ppg: 12.1, rpg: 3.3, apg: 1.8, spg: 0.7, bpg: 0.2, topg: 1.0, mpg: 25.9 } },
      { name: 'KJ Martin', position: 'PF', jersey: '6', stats: { ppg: 7.8, rpg: 4.9, apg: 0.7, spg: 0.5, bpg: 0.7, topg: 0.8, mpg: 19.4 } },
    ],
  },
  {
    team: 'Nets',
    players: [
      { name: 'Mikal Bridges', position: 'SF', jersey: '1', stats: { ppg: 26.1, rpg: 4.5, apg: 3.6, spg: 1.1, bpg: 0.5, topg: 2.3, mpg: 35.7 } },
      { name: 'Cam Thomas', position: 'SG', jersey: '5', stats: { ppg: 22.3, rpg: 4.2, apg: 3.1, spg: 0.8, bpg: 0.3, topg: 2.5, mpg: 33.5 } },
      { name: 'Nic Claxton', position: 'C', jersey: '33', stats: { ppg: 12.8, rpg: 8.8, apg: 1.8, spg: 0.7, bpg: 2.1, topg: 1.6, mpg: 28.3 } },
      { name: 'Spencer Dinwiddie', position: 'PG', jersey: '26', stats: { ppg: 14.6, rpg: 3.9, apg: 6.3, spg: 0.7, bpg: 0.3, topg: 2.5, mpg: 30.7 } },
      { name: 'Dorian Finney-Smith', position: 'PF', jersey: '28', stats: { ppg: 9.4, rpg: 5.0, apg: 2.3, spg: 1.1, bpg: 0.5, topg: 1.1, mpg: 29.4 } },
      { name: 'Lonnie Walker IV', position: 'SG', jersey: '8', stats: { ppg: 10.2, rpg: 2.8, apg: 2.1, spg: 0.8, bpg: 0.3, topg: 1.1, mpg: 24.6 } },
      { name: 'Trendon Watford', position: 'PF', jersey: '2', stats: { ppg: 6.3, rpg: 4.1, apg: 1.6, spg: 0.6, bpg: 0.3, topg: 0.9, mpg: 19.5 } },
      { name: 'Noah Clowney', position: 'PF', jersey: '21', stats: { ppg: 5.2, rpg: 4.7, apg: 0.8, spg: 0.5, bpg: 0.7, topg: 0.7, mpg: 17.2 } },
      { name: 'Dennis Schroder', position: 'PG', jersey: '17', stats: { ppg: 12.4, rpg: 3.5, apg: 5.2, spg: 0.9, bpg: 0.1, topg: 2.0, mpg: 27.6 } },
      { name: 'Day\'Ron Sharpe', position: 'C', jersey: '20', stats: { ppg: 7.1, rpg: 6.9, apg: 0.9, spg: 0.4, bpg: 0.8, topg: 1.2, mpg: 19.8 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Matchup schedule for game days
// ---------------------------------------------------------------------------
const GAME_MATCHUPS: Array<[string, string][]> = [
  [['Lakers', 'Celtics'], ['Warriors', 'Bucks'], ['Nuggets', 'Heat'], ['Clippers', 'Suns'], ['76ers', 'Nets']],
  [['Lakers', 'Warriors'], ['Celtics', 'Nuggets'], ['Bucks', 'Heat'], ['Clippers', '76ers'], ['Suns', 'Nets']],
  [['Lakers', 'Nuggets'], ['Celtics', 'Bucks'], ['Warriors', 'Heat'], ['Clippers', 'Nets'], ['Suns', '76ers']],
  [['Lakers', 'Suns'], ['Celtics', 'Heat'], ['Warriors', '76ers'], ['Bucks', 'Nets'], ['Nuggets', 'Clippers']],
];

// ---------------------------------------------------------------------------
// DataSource configuration
// ---------------------------------------------------------------------------
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306'),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'fantasy_nba',
  entities: [User, Player, PlayerSeasonStats, GameDay, Game, GamePlayerStats, Room, RoomMember, Lineup],
  synchronize: true,
  logging: false,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function generateBoxScore(position: string) {
  const base: Record<string, { pts: number[]; reb: number[]; ast: number[]; stl: number[]; blk: number[] }> = {
    PG: { pts: [8, 34], reb: [2, 7], ast: [4, 13], stl: [0, 4], blk: [0, 1] },
    SG: { pts: [8, 32], reb: [2, 7], ast: [2, 8], stl: [0, 4], blk: [0, 1] },
    SF: { pts: [8, 30], reb: [3, 10], ast: [1, 7], stl: [0, 3], blk: [0, 2] },
    PF: { pts: [6, 26], reb: [4, 13], ast: [1, 5], stl: [0, 2], blk: [0, 3] },
    C:  { pts: [6, 24], reb: [5, 15], ast: [0, 5], stl: [0, 2], blk: [0, 5] },
  };
  const b = base[position] ?? base['SF'];
  const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  return { pts: r(b.pts[0], b.pts[1]), reb: r(b.reb[0], b.reb[1]), ast: r(b.ast[0], b.ast[1]), stl: r(b.stl[0], b.stl[1]), blk: r(b.blk[0], b.blk[1]), toVal: r(0, 5), min: r(20, 38) };
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  await dataSource.initialize();
  console.log('Connected to database');

  // Clear all tables in reverse dependency order
  await dataSource.query('SET FOREIGN_KEY_CHECKS=0');
  const repos = [Lineup, RoomMember, Room, GamePlayerStats, Game, GameDay, PlayerSeasonStats, Player, User];
  for (const entity of repos) {
    await dataSource.getRepository(entity).clear();
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS=1');
  console.log('Cleared existing data');

  // ---------------------------------------------------------------------------
  // 1. Insert players
  // ---------------------------------------------------------------------------
  const playerRepo = dataSource.getRepository(Player);
  const allPlayerData: { player: Player; stats: { ppg: number; rpg: number; apg: number; spg: number; bpg: number; topg: number; mpg: number } }[] = [];

  for (const teamData of TEAMS_DATA) {
    for (const pd of teamData.players) {
      const player = playerRepo.create({
        name: pd.name,
        position: pd.position,
        team: teamData.team,
        jerseyNumber: pd.jersey,
        isActive: true,
      });
      const saved = await playerRepo.save(player);
      allPlayerData.push({ player: saved, stats: pd.stats });
    }
  }
  console.log(`Inserted ${allPlayerData.length} players`);

  // ---------------------------------------------------------------------------
  // 2. Compute and store season stats + costs
  // ---------------------------------------------------------------------------
  const statsRepo = dataSource.getRepository(PlayerSeasonStats);

  const rawInput = allPlayerData.map(({ player, stats }) => ({
    id: player.id,
    stats: { pts: stats.ppg, reb: stats.rpg, ast: stats.apg, stl: stats.spg, blk: stats.bpg, to: stats.topg },
  }));
  const costMap = computePlayerCosts(rawInput);

  for (const { player, stats } of allPlayerData) {
    const rawScore = computeFantasyScore(
      { pts: stats.ppg, reb: stats.rpg, ast: stats.apg, stl: stats.spg, blk: stats.bpg, to: stats.topg },
      SCORE_WEIGHTS_DEFAULT,
    );
    await statsRepo.save(statsRepo.create({
      playerId: player.id,
      season: CURRENT_SEASON,
      ppg: stats.ppg, rpg: stats.rpg, apg: stats.apg,
      spg: stats.spg, bpg: stats.bpg, topg: stats.topg, mpg: stats.mpg,
      fantasyScore: Number(rawScore.toFixed(2)),
      cost: costMap.get(player.id) ?? 5000,
    }));
  }
  console.log('Computed and stored player costs');

  // ---------------------------------------------------------------------------
  // 3. Seed game days: 3 completed + 1 active
  // ---------------------------------------------------------------------------
  const gameDayRepo = dataSource.getRepository(GameDay);
  const gameRepo = dataSource.getRepository(Game);
  const gameStatsRepo = dataSource.getRepository(GamePlayerStats);

  const playerByTeam = new Map<string, Player[]>();
  for (const { player } of allPlayerData) {
    if (!playerByTeam.has(player.team)) playerByTeam.set(player.team, []);
    playerByTeam.get(player.team)!.push(player);
  }

  const gameDays: GameDay[] = [];

  for (let i = 3; i >= 0; i--) {
    const isActive = i === 0;
    const gd = await gameDayRepo.save(gameDayRepo.create({
      date: getDateStr(i),
      status: isActive ? 'active' : 'completed',
      salaryCap: 50000,
    }));
    gameDays.push(gd);

    const matchups = GAME_MATCHUPS[3 - i];
    for (const [homeTeam, awayTeam] of matchups) {
      const game = await gameRepo.save(gameRepo.create({
        gameDayId: gd.id,
        homeTeam,
        awayTeam,
        status: isActive ? 'scheduled' : 'completed',
      }));

      // For completed days: generate full box scores
      if (!isActive) {
        const teams = [homeTeam, awayTeam];
        for (const team of teams) {
          const teamPlayers = playerByTeam.get(team) ?? [];
          for (const player of teamPlayers) {
            const box = generateBoxScore(player.position);
            const fantasyScore = computeFantasyScore(
              { pts: box.pts, reb: box.reb, ast: box.ast, stl: box.stl, blk: box.blk, to: box.toVal },
              SCORE_WEIGHTS_DEFAULT,
            );
            await gameStatsRepo.save(gameStatsRepo.create({
              gameId: game.id,
              playerId: player.id,
              pts: box.pts, reb: box.reb, ast: box.ast,
              stl: box.stl, blk: box.blk, toVal: box.toVal, min: box.min,
              fantasyScore: Number(fantasyScore.toFixed(2)),
            }));
          }
        }
      } else {
        // For active day: create placeholder stats so lineup validator knows who's eligible
        const teams = [homeTeam, awayTeam];
        for (const team of teams) {
          const teamPlayers = playerByTeam.get(team) ?? [];
          for (const player of teamPlayers) {
            await gameStatsRepo.save(gameStatsRepo.create({
              gameId: game.id,
              playerId: player.id,
              pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, toVal: 0, min: 0,
              fantasyScore: 0,
            }));
          }
        }
      }
    }
  }
  console.log(`Seeded ${gameDays.length} game days with games and stats`);

  // ---------------------------------------------------------------------------
  // 4. Create official room
  // ---------------------------------------------------------------------------
  const roomRepo = dataSource.getRepository(Room);
  const officialRoom = await roomRepo.save(roomRepo.create({
    name: 'Official Room',
    ownerId: null,
    isOfficial: true,
    ptsWeight: 1.0, rebWeight: 1.2, astWeight: 1.5,
    stlWeight: 3.0, blkWeight: 3.0, toWeight: -1.0,
    salaryCap: 50000,
  }));
  console.log(`Created official room (id=${officialRoom.id})`);

  // ---------------------------------------------------------------------------
  // 5. Create admin user and test users
  // ---------------------------------------------------------------------------
  const userRepo = dataSource.getRepository(User);
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin123', 10);
  await userRepo.save(userRepo.create({
    username: 'admin',
    email: process.env.ADMIN_EMAIL ?? 'admin@fantasy.com',
    passwordHash: adminPasswordHash,
    isAdmin: true,
  }));

  const testUsers: User[] = [];
  for (let i = 1; i <= 3; i++) {
    const hash = await bcrypt.hash(`password${i}`, 10);
    const user = await userRepo.save(userRepo.create({
      username: `player${i}`,
      email: `player${i}@test.com`,
      passwordHash: hash,
      isAdmin: false,
    }));
    testUsers.push(user);
  }
  console.log(`Created admin + ${testUsers.length} test users`);

  // ---------------------------------------------------------------------------
  // 6. Create sample lineups for completed game days
  // ---------------------------------------------------------------------------
  const lineupRepo = dataSource.getRepository(Lineup);
  const statsRows = await statsRepo.find({ where: { season: CURRENT_SEASON } });
  const costById = new Map(statsRows.map((s) => [s.playerId, s.cost]));

  const completedGameDays = gameDays.filter((gd) => gd.status === 'completed');

  for (const user of testUsers) {
    for (const gd of completedGameDays) {
      // Pick 1 player per position from eligible players on this game day
      const eligibleStats = await gameStatsRepo
        .createQueryBuilder('gps')
        .select('gps.player_id', 'playerId')
        .innerJoin('gps.game', 'g')
        .where('g.gameDayId = :gameDayId', { gameDayId: gd.id })
        .getRawMany<{ playerId: number }>();
      const eligibleIds = new Set(eligibleStats.map((s) => Number(s.playerId)));

      const eligiblePlayers = allPlayerData
        .filter((p) => eligibleIds.has(p.player.id))
        .map((p) => p.player);

      const byPosition: Record<string, Player[]> = { PG: [], SG: [], SF: [], PF: [], C: [] };
      for (const p of eligiblePlayers) {
        if (byPosition[p.position]) byPosition[p.position].push(p);
      }

      // Shuffle and pick
      for (const pos of ['PG', 'SG', 'SF', 'PF', 'C']) {
        byPosition[pos].sort(() => Math.random() - 0.5);
      }

      // Build a lineup under salary cap
      let attempts = 0;
      let lineup: { PG: Player; SG: Player; SF: Player; PF: Player; C: Player } | null = null;
      while (attempts < 20 && !lineup) {
        const candidates = {
          PG: byPosition['PG'][attempts % Math.max(byPosition['PG'].length, 1)],
          SG: byPosition['SG'][attempts % Math.max(byPosition['SG'].length, 1)],
          SF: byPosition['SF'][attempts % Math.max(byPosition['SF'].length, 1)],
          PF: byPosition['PF'][attempts % Math.max(byPosition['PF'].length, 1)],
          C:  byPosition['C'][attempts % Math.max(byPosition['C'].length, 1)],
        };
        if (!candidates.PG || !candidates.SG || !candidates.SF || !candidates.PF || !candidates.C) break;
        const totalCost = [candidates.PG.id, candidates.SG.id, candidates.SF.id, candidates.PF.id, candidates.C.id]
          .reduce((sum, id) => sum + (costById.get(id) ?? 0), 0);
        if (totalCost <= 50000) {
          lineup = candidates;
        }
        attempts++;
      }

      if (!lineup) continue;

      const playerIds = [lineup.PG.id, lineup.SG.id, lineup.SF.id, lineup.PF.id, lineup.C.id];
      const totalCost = playerIds.reduce((sum, id) => sum + (costById.get(id) ?? 0), 0);

      // Calculate actual score from game stats
      const actualStats = await gameStatsRepo
        .createQueryBuilder('gps')
        .innerJoin('gps.game', 'g')
        .where('g.gameDayId = :gameDayId', { gameDayId: gd.id })
        .andWhere('gps.playerId IN (:...playerIds)', { playerIds })
        .getMany();

      const totalScore = actualStats.reduce((sum, s) => sum + Number(s.fantasyScore), 0);

      await lineupRepo.save(lineupRepo.create({
        userId: user.id,
        roomId: officialRoom.id,
        gameDayId: gd.id,
        pgId: lineup.PG.id, sgId: lineup.SG.id, sfId: lineup.SF.id,
        pfId: lineup.PF.id, cId: lineup.C.id,
        totalCost,
        totalScore: Number(totalScore.toFixed(2)),
      }));
    }
  }
  console.log('Created sample lineups for test users on completed game days');

  await dataSource.destroy();
  console.log('\n✅ Seed complete!');
  console.log('  Admin login: admin@fantasy.com / admin123');
  console.log('  Test users: player1@test.com / password1, player2@test.com / password2, player3@test.com / password3');
  console.log(`  Official Room ID: ${officialRoom.id}`);
  console.log(`  Active Game Day ID: ${gameDays.find((g) => g.status === 'active')?.id}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
