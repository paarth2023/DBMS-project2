# DBMS Project 2

## Overview
This project is a **Crime Database Management System (DBMS)** that efficiently organizes and manages crime-related data, including details about **victims, suspects, police officers, and legal cases**. The system ensures structured storage, retrieval, and management of criminal records.

## Features
- **Relational database design** with multiple interconnected tables.
- **CRUD operations** for victims, suspects, police officers, and cases.
- **Foreign key constraints** to maintain data integrity.
- **SQL queries** for case assignment and retrieval.
- **User-friendly interface** for database interaction (if applicable).

## Database Schema
The system consists of the following key tables:
- `Victim` – Stores details of victims.
- `Suspect` – Contains suspect information.
- `Police_Officer` – Manages police officer records.
- `Legal_Case` – Links victims, suspects, and officers in active cases.
- (`Optional`) **Assigned_To Table** – Maps officers to legal cases (if normalization is applied).

## Technologies Used
- **SQL** (MySQL/PostgreSQL/SQLite)
- **Python/Java/PHP** (if applicable)
- **DBMS Concepts** (Normalization, Indexing, Foreign Keys)

## Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/paarth2023/DBMS-project2.git
   cd DBMS-project2
2. Set up the database schema using the provided SQL scripts.  
   ```bash
   mysql -u <username> -p < database_schema.sql

