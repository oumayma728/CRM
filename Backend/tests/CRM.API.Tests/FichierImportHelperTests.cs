using System.Text;
using Backend.Entities;
using Backend.Helpers;
using FluentAssertions;

namespace CRM.API.Tests;

public class FichierImportHelperTests
{
    [Fact]
    public void ToCsv_WritesHeaderAndOneLinePerContact()
    {
        var fichier = new FichierImport { NomFichier = "campagne_sept" };
        fichier.Contacts.Add(new Contact { Nom = "Durand", Prenom = "Léa", Telephone = "0600000001", Email = "lea@test.com" });
        fichier.Contacts.Add(new Contact { Nom = "Martin", Prenom = "Paul", Telephone = "0600000002" });

        var (bytes, name) = FichierImportHelper.ToCsv(fichier);
        var lines = Encoding.UTF8.GetString(bytes).Trim().Split('\n');

        name.Should().StartWith("campagne_sept_").And.EndWith(".csv");
        lines.Should().HaveCount(3);
        lines[0].Should().StartWith("Nom,Prénom,Téléphone,Email");
        lines[1].Should().StartWith("Durand,Léa,0600000001,lea@test.com");
    }
}
