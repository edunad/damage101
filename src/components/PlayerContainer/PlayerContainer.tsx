'use strict';

import * as React from 'react';
import FlipMove from 'react-flip-move';

import { Player } from '../../models/Player';
import { Encounter } from '../../models/Encounter';
import { EncounterService } from '../../services/EncounterService';
import { PlayerElement } from '../PlayerElement/PlayerElement';
import { EncounterSortPlugin } from '../../interfaces/Sort/EncounterSortPlugin';
import { HookSubscription } from '@edunad/hooks';
import { SettingsService } from '../../services/SettingsService';

interface PlayerContainerState {
    currentEncounter: Encounter;
    currentSortPlugin: EncounterSortPlugin;
    isMinified: boolean;
}

export class PlayerContainer extends React.Component<any, PlayerContainerState> {
    private onEncounterUpdate: HookSubscription;
    private onSortUpdate: HookSubscription;
    private onMinifyUpdate: HookSubscription;

    constructor(props: any) {
        super(props);
        this.state = {
            currentEncounter: null,
            currentSortPlugin: null,

            isMinified: false
        };
    }

    public componentDidMount(): void {
        this.setState({
            currentEncounter: EncounterService.getCurrentEncounter(),
            currentSortPlugin: EncounterService.getCurrentSortPlugin(),

            isMinified: SettingsService.isMinified()
        });

        this.subscribeObservables();
    }

    public componentWillUnmount(): void {
        this.unsubscribeObservables();
    }

    private subscribeObservables(): void {
        this.onEncounterUpdate = EncounterService.onEncounterUpdate.add('player-encounterUpdate', (data: Encounter) => {
            this.setState({
                currentEncounter: data
            });
        });

        this.onSortUpdate = EncounterService.onSortUpdate.add('player-sortUpdate', (data: EncounterSortPlugin) => {
            this.setState({
                currentSortPlugin: data
            });
        });

        this.onMinifyUpdate = SettingsService.onMinifyChange.add('player-minifyUpdate', (data: boolean) => {
            this.setState({
                isMinified: data
            });
        });
    }

    private unsubscribeObservables(): void {
        this.onEncounterUpdate.destroy();
        this.onSortUpdate.destroy();
        this.onMinifyUpdate.destroy();
    }

    private isPlayerVisibile(target: Player, plys: Player[]): [boolean, number] {
        let bounds: DOMRect = window['app-container'].getBoundingClientRect();
        let playerElementSize: number = 20; // In pixels
        let currentSize: number = 22;
        let canSee: boolean = false;
        let visibleRows: number = 0;

        for(visibleRows = 0; visibleRows < plys.length; visibleRows++) {
            if(currentSize >= bounds.height) break;
            currentSize += playerElementSize;

            if(plys[visibleRows] == null) continue;
            if(plys[visibleRows] === target) {
                canSee = true;
            }
        }

        return [canSee, visibleRows];
    }

    private renderPlayer(index: number, ply: Player): any {
        return (
            <PlayerElement index={index}
                key={ply.getName()}
                sorting={this.state.currentSortPlugin}
                player={ply}
                minified={this.state.isMinified}
            />
        );
    }

    private renderPlayers(plys: Player[]): any {
        let localPly: [Player, number] = EncounterService.getLocalPlayer();
        let canSeePlayer: [boolean, number] = null;
        if(localPly != null) canSeePlayer = this.isPlayerVisibile(localPly[0], plys);

        // Make sure the player is ALWAYS visible, even if doing an awful job :3
        return plys.map((ply: Player, index: number) => {
            if(index >= canSeePlayer[1]) return;
            if(canSeePlayer != null && !canSeePlayer[0] && index >= (canSeePlayer[1] - 1)) {
                if(index == (canSeePlayer[1] - 1)){
                   return this.renderPlayer(localPly[1] + 1, localPly[0]);
                }
            } else {
                return this.renderPlayer(index + 1, ply);
            }
        });
    }

    private renderPlayerList(players: Player[]): any {
        return (
            <FlipMove enterAnimation={false} leaveAnimation={false}>
                {this.renderPlayers(players)}
            </FlipMove>
        )
    }

    public render(): any {
        let players: Player[] = null;
        let encounter: Encounter = this.state.currentEncounter;
        if(encounter != null) players = encounter.getPlayers();

        return(
            <div className='player-list' id='player-list-container'>
                {players != null && players.length > 0 ? this.renderPlayerList(players) : null}
            </div>
        );
    }
}