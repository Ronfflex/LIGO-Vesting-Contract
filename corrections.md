# Corrections 

Il y a incontestablement du travail, un bon README, le code compile, les entrypoints renvoient bien des `operations` sur le token, le storage est modifié mais 
- mauvais design des periodes - date au lieu de durée
- vesting status compliqué (et d'ailleurs inutile, pas besoin de stocker l'état)
- l'entrypoint `claim` ne doit pas prendre le montant en paramètre.
- pas de tests
- pas d'entrypoint kill
- script de déploiement pas fonctionnel

## Remarques

Compliqué de s'assurer que tout marche bien sans tests (ni tests unitaires, ni tests d'intégration). 

Je vois que tu as créer un nouveau contrat Token (surcharge du FA2 extendable). C'est bien mais c'était pas demandé ! Par contre, il manque le script de déploiement du token.

les gestion des periodes de gel et de vesting sont bizares. L'entrypoint Start est censé determiné les dates de debut et fin de gel. Dans ton cas , elles sont déterminées dans le storage initial losr du déploiment. du coup, dans ton code tu verifies le start n'arrive pas après la fin du vesting ! 
Il était attendu une gestion des durée de périodes (c'est à dire periode de gel dure 30000 secondes et de vesting 3202111 secondes, par exemple). Gérer les durée permet de s'assurer que la periode de gel à bien était appliquée.     



### Dans le README.md
la ligne de compilation produit un fichier `Vesting.mligo.json` mais le script de déploiement cherche le fichier `../compiled/vesting.mligo.json` 

- avant de lancer la première fois la compilation il faut créer le repertoire *compiled*
- explications pas claires sur le process de déploiement

- expliquer comment set les variables d'envirronnement (.env + exemple)
- le lancement du script de déploiement n'affiche rien ! on sait pas si ça fonctionne !



### Dans le script de déploimement

- as -tu vraiment déployé ton contrat ? la fonction `DeployVesting` n'est pas appelée. Par ailleurs il faut déployer un token FA2 avant de déployer le vesting. Il manque les commandes pour déployer un token. Quelquechose comme
```
cd .ligo/source/i/ligo__s__fa__1.3.0__ffffffff
ligo compile contract single_asset.impl.mligo > ../../../../compiled/fa2_single_asset.mligo.tz
ligo compile contract single_asset.impl.mligo --michelson-format json > ../../../../compiled/fa2_single_asset.mligo.json
```

- dans le storage initial, le format des dates n'est pas bon. Taquito s'attend à une string et pas une date. Par exemple,
```
start_freeze_period: "2024-04-15T00:00:00Z", //new Date("2024-04-15T00:00:00Z")
```
 - une des variables `vesting_status` n'est pas initialisée (le storage initial n'est pas complet)

les addresses de bénéficiaires semblent êter des copié/collé avec une lettre qui change (bref des addresses pas valides)
```
    tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN: 1000,
    tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwQ: 2000,
    tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwA: 3000,
```

### Dans le code


[L78] -  La fonction Claim ne doit pas prendre de parametres (l'utilisateur demande ce qui lui est dû mais il sait pas pas combien exactement). Ce montant à transferer doit être calculé par la fonction Claim. La consigne consitait justement à calculer la quantité de token au pro rata du temps passé. Dans ton cas, l'utilisateur peut spécifier le montant qu'il veux quand il veux (pendant la période de Claim).

[L83] -  Dans la fonction Claim, le test suivant est très bizare car il empeche quelqu'un de retirer son argent après la fin de la période de vesting ! donc l'utilisateur doit claim juste avant la date de fin de vesting pour avoir son argetn (et probablement pas la totalité).


BEST PRACTICE [L72] - modifier plusieurs champs du storage en une seule ligne
```
    let new_store = { store with 
        start_freeze_period = Tezos.get_now();
        vesting_status = Vesting_has_started;
        beneficiaries = updateValue(store.beneficiaries, (Tezos.get_sender()), amount_ + old_balance)
    } in

```
au lieu de 
```
    let store = { store with start_freeze_period = Tezos.get_now()} in
    let store = { store with vesting_status = Vesting_has_started} in
    let store = { store with beneficiaries = updateValue(store.beneficiaries, (Tezos.get_sender()), amount_ + old_balance)} in
```

pas d'entrypoint `kill`