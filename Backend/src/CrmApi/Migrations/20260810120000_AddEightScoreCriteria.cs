using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrmApi.Migrations
{
    /// <inheritdoc />
    public partial class AddEightScoreCriteria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ScoreAccueil",
                table: "calls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ScoreClient",
                table: "calls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ScoreConclusion",
                table: "calls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ScoreEfficacite",
                table: "calls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ScoreEnergie",
                table: "calls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ScoreOperateur",
                table: "calls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ScoreVoix",
                table: "calls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TranscriptionStatus",
                table: "calls",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScoreAccueil",
                table: "calls");

            migrationBuilder.DropColumn(
                name: "ScoreClient",
                table: "calls");

            migrationBuilder.DropColumn(
                name: "ScoreConclusion",
                table: "calls");

            migrationBuilder.DropColumn(
                name: "ScoreEfficacite",
                table: "calls");

            migrationBuilder.DropColumn(
                name: "ScoreEnergie",
                table: "calls");

            migrationBuilder.DropColumn(
                name: "ScoreOperateur",
                table: "calls");

            migrationBuilder.DropColumn(
                name: "ScoreVoix",
                table: "calls");

            migrationBuilder.DropColumn(
                name: "TranscriptionStatus",
                table: "calls");
        }
    }
}
